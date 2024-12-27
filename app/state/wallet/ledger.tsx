import { handleWalletError } from '@/lib/utils';
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webhid';
import { observable } from '@legendapp/state';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { appsConfigs, type AppsId } from 'app/config/apps';
import { errorDetails, LedgerErrorDetails } from 'app/config/errors';
import { ConnectionResponse, DeviceConnectionProps } from '../types/ledger';

interface LedgerWalletState {
  deviceConnection: {
    connection?: DeviceConnectionProps;
    isLoading: boolean;
    error?: LedgerErrorDetails;
  };
  synchronization: {
    // isAppOpen: boolean;
    genericApp?: PolkadotGenericApp;
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
    // isAppOpen: false,
    isSynchronized: false,
    genericApp: undefined,
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

      const newDeviceConnection = {
        connection: { transport },
        isLoading: false,
        error: undefined
      };

      ledgerWalletState$.deviceConnection.assign(newDeviceConnection);
      return newDeviceConnection.connection;
    } catch (e) {
      handleWalletError(e, errorDetails.connection_error);
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
      const error = handleWalletError(e, errorDetails.connection_error);
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
    let { synchronization } = ledgerWalletState$.get();

    let genericApp =
      synchronization?.genericApp as unknown as PolkadotGenericApp;

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
  async isAppReady(): Promise<boolean> {
    let {
      deviceConnection: { connection },
      synchronization
    } = ledgerWalletState$.get();
    let transport: Transport | undefined =
      connection?.transport as unknown as Transport;
    let genericApp =
      synchronization?.genericApp as unknown as PolkadotGenericApp;

    try {
      // Establish transport and add disconnect event listener
      if (!transport) {
        const result = await ledgerWalletState$.connectDevice();

        if (!result?.connected) {
          return false;
        }
      }

      // Establish genericApp
      if (!genericApp) {
        genericApp = new PolkadotGenericApp(transport);
        ledgerWalletState$.synchronization.genericApp.set(genericApp);
      }

      // Check if the app is open
      await genericApp.getVersion();
      return true;
    } catch (e) {
      handleWalletError(e, errorDetails.connection_error);
      return false;
    }
  },
  async synchronizeAccount(
    appId: AppsId
  ): Promise<{ result?: GenericeResponseAddress[]; error?: boolean }> {
    const app = appsConfigs[appId.toUpperCase()];

    if (!app) {
      console.error(`The appId ${appId} is not supported.`);
      return Promise.reject(new Error(`The appId ${appId} is not supported.`));
    }

    try {
      const isAppReady = await ledgerWalletState$.isAppReady();
      if (!isAppReady) {
        return { error: true };
      }

      // Get addresses from the Ledger device
      const addresses = await Promise.all(
        Array.from({ length: 5 }).map(async (_, i) => {
          const bip44Path = app.bip44Path.replace(/\/0'$/, `/${i}'`);

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

      return Promise.resolve({ result: filteredAddresses });
    } catch (e) {
      handleWalletError(e, errorDetails.connection_error);
      return Promise.resolve({ error: true });
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
        handleWalletError(e, errorDetails.disconnection_error);
      }
    }
  }
});
