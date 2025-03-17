import { createTransfer, getBip44Path } from '@/lib/account';
import { formatVersion, handleWalletError } from '@/lib/utils';

import { openApp } from '@/lib/ledger/openApp';
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webhid';
import { observable } from '@legendapp/state';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { AppConfig, AppIds, appsConfigs } from 'app/config/apps';
import { maxAddressesToFetch } from 'app/config/config';
import { InternalErrors, LedgerErrorDetails } from 'app/config/errors';
import { errorApps } from 'app/config/mockData';
import { uiState$ } from 'app/state/ui';
import {
  Address,
  ConnectionResponse,
  DeviceConnectionProps,
  TransactionStatus
} from '../types/ledger';

interface LedgerWalletState {
  deviceConnection: {
    connection?: DeviceConnectionProps;
    isLoading: boolean;
    error?: LedgerErrorDetails;
  };
  synchronization: {
    isSynchronized: boolean;
    isLoading: boolean;
    error?: LedgerErrorDetails;
  };
}

export const InitialWalletState: LedgerWalletState = {
  deviceConnection: {
    connection: undefined,
    isLoading: false,
    error: undefined
  },
  synchronization: {
    isSynchronized: false,
    isLoading: false,
    error: undefined
  }
};

export const ledgerWalletState$ = observable({
  ...InitialWalletState,

  // Open Polkadot Migration App
  async openPolkadotMigrationApp(transport: Transport) {
    try {
      if (!transport) {
        throw new Error('Transport not initialized');
      }
      await openApp(transport, 'Polkadot Migration');
      return { connected: true };
    } catch (e) {
      console.error('Error opening Polkadot Migration app:', e);
      return {
        connected: false,
        error: handleWalletError(e, InternalErrors.APP_NOT_OPEN) // More specific error
      };
    }
  },

  // Initialize Ledger Transport
  async initializeTransport(): Promise<Transport> {
    const transport = await TransportWebUSB.create();
    transport?.on('disconnect', () => {
      ledgerWalletState$.assign(InitialWalletState);
      console.log('disconnecting');
    });
    return transport;
  },

  // Get App Version
  async getAppVersion(
    genericApp: PolkadotGenericApp
  ): Promise<string | undefined> {
    try {
      const versionResult = await genericApp.getVersion();
      return formatVersion(versionResult);
    } catch (e) {
      handleWalletError(e, InternalErrors.APP_NOT_OPEN); // Specific error type
      return undefined;
    }
  },

  // Establish Device Connection
  async establishDeviceConnection(): Promise<
    DeviceConnectionProps | undefined
  > {
    ledgerWalletState$.deviceConnection.isLoading.set(true);
    ledgerWalletState$.deviceConnection.error.set(undefined);

    try {
      let transport = await ledgerWalletState$.initializeTransport();
      let genericApp = new PolkadotGenericApp(transport);

      // Attempt to get version, which implicitly checks if the app is open
      let version = await ledgerWalletState$.getAppVersion(genericApp);

      if (!version) {
        // If getVersion fails, try opening the app
        const result =
          await ledgerWalletState$.openPolkadotMigrationApp(transport);
        if (result.error) {
          return undefined; // Error already handled in openPolkadotMigrationApp
        }
        version = await ledgerWalletState$.getAppVersion(genericApp); // Try getting version again
        if (!version) return undefined; // If still no version, return.
      }

      return { transport, genericApp };
    } catch (e) {
      handleWalletError(e, InternalErrors.CONNECTION_ERROR);
      return undefined;
    } finally {
      ledgerWalletState$.deviceConnection.isLoading.set(false);
    }
  },

  // Connect to Device (Simplified - uses establishDeviceConnection)
  async connectDevice(): Promise<ConnectionResponse | undefined> {
    console.log('Attempting to connect device...');
    try {
      const connection = await ledgerWalletState$.establishDeviceConnection();
      if (!connection) {
        console.log('Failed to establish device connection');
        return {
          connected: false,
          error: ledgerWalletState$.deviceConnection.error.get()?.title
        };
      }

      ledgerWalletState$.deviceConnection.connection.set(connection); // Store the connection
      console.log('Device connected successfully');
      return { connected: true };
    } catch (e) {
      const error = handleWalletError(e, InternalErrors.CONNECTION_ERROR);
      return {
        connected: false,
        error: error.title
      };
    }
  },

  // Get Account Address
  async getAccountAddress(
    bip44Path: string,
    ss58prefix: number,
    showAddrInDevice: boolean
  ): Promise<GenericeResponseAddress | undefined> {
    const connection = ledgerWalletState$.deviceConnection.connection.get();
    const genericApp = connection?.genericApp as unknown as PolkadotGenericApp;

    if (!genericApp) {
      console.error('Ledger app not initialized');
      return undefined;
    }

    try {
      // Get the address from the Ledger device
      return await genericApp.getAddress(
        bip44Path,
        ss58prefix,
        showAddrInDevice
      );
    } catch (e) {
      // Not throwing, returning undefined.  Caller handles this.
      return undefined;
    }
  },

  // Fetch and Save Addresses (using a for loop)
  async fetchAndSaveAddresses(
    app: AppConfig
  ): Promise<GenericeResponseAddress[]> {
    const addresses: (GenericeResponseAddress | undefined)[] = [];
    for (let i = 0; i < maxAddressesToFetch; i++) {
      const bip44Path = getBip44Path(app.bip44Path, i);
      const address = await ledgerWalletState$.getAccountAddress(
        bip44Path,
        app.ss58Prefix,
        false
      );
      addresses.push(address);
    }

    const filteredAddresses = addresses.filter(
      (address): address is GenericeResponseAddress => address !== undefined
    ); // Type guard

    return filteredAddresses;
  },

  // Synchronize Accounts
  async synchronizeAccounts(
    app: AppConfig
  ): Promise<{ result?: GenericeResponseAddress[]; error?: boolean }> {
    const connection = ledgerWalletState$.deviceConnection.connection.get();

    // TODO: Delete mock
    if (errorApps.includes(app.id)) {
      return { error: true };
    }

    if (!connection) {
      return { error: true };
    }

    try {
      const addresses = await ledgerWalletState$.fetchAndSaveAddresses(app);
      return { result: addresses };
    } catch (e) {
      handleWalletError(e, InternalErrors.SYNC_ERROR); // More specific error
      return { error: true };
    }
  },

  // Prepare Migration
  prepareMigration(
    appId: AppIds,
    account: Address
  ):
    | {
        senderAddress: string;
        receiverAddress: string;
        transferAmount: number;
        appConfig: AppConfig;
      }
    | { error: string } {
    // Define sender and receiver addresses and the amount to transfer
    const senderAddress = account.address;

    // Use the selected destination address if available, otherwise fall back to default behavior
    const receiverAddress = account.destinationAddress;

    const transferAmount = account.balance;
    const appConfig = appsConfigs.get(appId);

    if (!receiverAddress) {
      return { error: 'No Polkadot address to migrate to.' };
    }
    if (!transferAmount) {
      return { error: 'there is no amount to transfer' };
    }
    if (!appConfig) {
      return { error: `App configuration for ${appId} not found.` };
    }

    return { senderAddress, receiverAddress, transferAmount, appConfig };
  },

  // Migrate Account
  async migrateAccount(
    appId: AppIds,
    account: Address,
    accountIndex: number
  ): Promise<{ migrated?: boolean; error?: string }> {
    const migrationData = ledgerWalletState$.prepareMigration(appId, account);
    if (!migrationData || 'error' in migrationData) {
      return { error: migrationData?.error ?? 'Migration preparation failed.' };
    }

    const { senderAddress, receiverAddress, transferAmount, appConfig } =
      migrationData;

    const genericApp =
      ledgerWalletState$.deviceConnection.connection.genericApp.get();
    if (!genericApp) {
      return { error: 'Generic app not found' };
    }

    const updateStatus = (
      status: TransactionStatus,
      message?: string,
      txDetails?: { txHash?: string; blockHash?: string; blockNumber?: string }
    ) => {
      uiState$.migrateAccountSetStatus(
        appId,
        accountIndex,
        status,
        message,
        txDetails
      );
    };

    try {
      // Perform the transfer
      await createTransfer(
        genericApp as unknown as PolkadotGenericApp,
        senderAddress,
        receiverAddress,
        transferAmount,
        appConfig,
        accountIndex,
        updateStatus
      );
      return { migrated: true };
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred';
      return { error: errorMessage };
    }
  },

  // Clear Connection
  clearConnection() {
    ledgerWalletState$.deviceConnection.connection.set(undefined);
  },

  // Disconnect
  disconnect() {
    const { deviceConnection } = ledgerWalletState$.get();
    if (deviceConnection.connection?.transport) {
      try {
        deviceConnection.connection.transport.close();
        deviceConnection.connection.transport.emit('disconnect');
      } catch (e) {
        handleWalletError(e, InternalErrors.DISCONNECTION_ERROR);
      }
    }
  }
});
