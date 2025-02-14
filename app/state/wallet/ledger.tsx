import { createTransfer, getBip44Path } from '@/lib/account';
import { handleWalletError } from '@/lib/utils';
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webhid';
import { observable } from '@legendapp/state';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { AppIds, appsConfigs } from 'app/config/apps';
import { InternalErrors, LedgerErrorDetails } from 'app/config/errors';
import {
  Address,
  ConnectionResponse,
  DeviceConnectionProps
} from '../types/ledger';

const polkadotAddresses = observable<Address[]>([]);

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
  async getDeviceConnection(): Promise<DeviceConnectionProps | undefined> {
    let {
      deviceConnection: { connection }
    } = ledgerWalletState$.get();
    let transport: Transport | undefined =
      connection?.transport as unknown as Transport;
    let genericApp = connection?.genericApp as unknown as PolkadotGenericApp;

    ledgerWalletState$.deviceConnection.isLoading.set(true);
    ledgerWalletState$.deviceConnection.error.set(undefined);

    try {
      // Establish transport and add disconnect event listener
      if (!transport) {
        transport = await TransportWebUSB.create();
        transport?.on('disconnect', () => {
          ledgerWalletState$.assign(InitialWalletState);
          console.log('disconnecting');
        });
      }

      if (!genericApp) {
        console.log(
          'No transport found, attempting to get device connection...'
        );
        genericApp = new PolkadotGenericApp(
          transport,
          undefined,
          'https://api.zondax.ch/polkadot/transaction/metadata'
        );

        // Check if the app is open
        await genericApp.getVersion();
      }

      const newDeviceConnection = {
        connection: { transport, genericApp },
        isLoading: false,
        error: undefined
      };

      ledgerWalletState$.deviceConnection.assign(newDeviceConnection);
      return newDeviceConnection.connection;
    } catch (e) {
      handleWalletError(e, InternalErrors.CONNECTION_ERROR);
      return undefined;
    }
  },
  async connectDevice(): Promise<ConnectionResponse | undefined> {
    console.log('Attempting to connect device...');
    try {
      const { deviceConnection, getDeviceConnection } =
        ledgerWalletState$.get();

      ledgerWalletState$.deviceConnection.isLoading.set(true);
      ledgerWalletState$.deviceConnection.error.set(undefined);

      const transport = deviceConnection.connection?.transport;

      // Check if transport is already established
      if (!transport) {
        console.log(
          'No transport found, attempting to get device connection...'
        );
        const connection = await getDeviceConnection();
        if (!connection) {
          console.log('Failed to establish device connection');
          ledgerWalletState$.deviceConnection.isLoading.set(false);
          return {
            connected: false,
            error: ledgerWalletState$.deviceConnection.error.get()?.title
          };
        }
      }

      console.log('Device connected successfully');
      return { connected: true };
    } catch (e) {
      const error = handleWalletError(e, InternalErrors.CONNECTION_ERROR);
      return {
        error: error.title,
        connected: false
      };
    }
  },
  async getAccountAddress(
    bip44Path: string,
    ss58prefix: number,
    showAddrInDevice: boolean
  ): Promise<GenericeResponseAddress | undefined> {
    let connection = ledgerWalletState$.deviceConnection.connection.get();

    let genericApp = connection?.genericApp as unknown as PolkadotGenericApp;

    try {
      // Get the address from the Ledger device
      const address = await genericApp.getAddress(
        bip44Path,
        ss58prefix,
        showAddrInDevice
      );
      return address;
    } catch (e) {
      return undefined; // it means the address doesn't exist
    }
  },
  async synchronizeAccounts(
    appId: AppIds
  ): Promise<{ result?: GenericeResponseAddress[]; error?: boolean }> {
    const connection = ledgerWalletState$.deviceConnection.connection.get();
    const app = appsConfigs.get(appId);

    // TODO: Delete mock
    if (appId === 'equilibrium') {
      return { error: true };
    }
    if (!app) {
      console.error(`The appId ${appId} is not supported.`);
      return Promise.reject(new Error(`The appId ${appId} is not supported.`));
    }

    try {
      if (!connection) {
        return { error: true };
      }

      // Get addresses from the Ledger device
      const addresses = await Promise.all(
        Array.from({ length: 5 }).map(async (_, i) => {
          const bip44Path = getBip44Path(app.bip44Path, i);
          return await ledgerWalletState$.getAccountAddress(
            bip44Path,
            app.ss58Prefix,
            false
          );
        })
      );
      // Filter out undefined addresses
      const filteredAddresses = addresses.filter(
        (address) => address !== undefined
      );

      // Save the Polkadot addresses for future use during migration
      if (appId === 'polkadot') {
        polkadotAddresses.set(filteredAddresses);
      }

      return Promise.resolve({ result: filteredAddresses });
    } catch (e) {
      handleWalletError(e, InternalErrors.CONNECTION_ERROR);
      return Promise.resolve({ error: true });
    }
  },
  async migrateAccount(
    appId: AppIds,
    account: Address,
    accountIndex: number
  ): Promise<{ migrated?: boolean; error?: string }> {
    try {
      // Define sender and receiver addresses and the amount to transfer
      const senderAddress = account.address;
      if (!polkadotAddresses.get() || !polkadotAddresses.get()[accountIndex]) {
        return { error: 'there is no polkadot address to migrate to.' };
      }
      const receiverAddress = polkadotAddresses.get()[accountIndex].address;

      const transferAmount = account.balance;
      if (!transferAmount) {
        return { error: 'there is no amount to transfer' };
      }

      // Find the ticker for the given appId
      const appConfig = appsConfigs.get(appId);
      if (!appConfig) {
        return { error: `App configuration for ${appId} not found.` };
      }
      const ticker = appConfig.ticker;

      const polkadotConfig = appsConfigs.get(AppIds.POLKADOT);
      if (!polkadotConfig?.rpcEndpoint) {
        throw new Error('Polkadot configuration not found');
      }
      const genericApp =
        ledgerWalletState$.deviceConnection.connection.genericApp.get();
      if (!genericApp) {
        throw new Error('Generic app not found');
      }

      try {
        // Perform the transfer
        await createTransfer(
          genericApp as unknown as PolkadotGenericApp,
          senderAddress,
          receiverAddress,
          transferAmount,
          polkadotConfig,
          ticker,
          accountIndex
        );
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : 'An unknown error occurred';
        return { error: errorMessage };
      }

      // Wait for 5 seconds before responding
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { migrated: true };
    } catch (e) {
      return { error: (e as Error).message };
    }
  },
  clearConnection() {
    ledgerWalletState$.deviceConnection.connection.set(undefined);
  },
  disconnect() {
    const { deviceConnection } = ledgerWalletState$.get();

    // Close the transport connection if it exists
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
