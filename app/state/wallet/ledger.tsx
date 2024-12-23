import { handleError } from '@/lib/utils';
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webhid';
import { observable } from '@legendapp/state';
import { errorDetails, LedgerErrorParams } from 'app/config/errors';
import { ConnectionResponse, DeviceConnectionProps } from '../types/ledger';

interface LedgerWalletState {
  deviceConnection: DeviceConnectionProps | undefined;
  isLoading: boolean;
  error: LedgerErrorParams | undefined;
}

export const InitialWalletState: LedgerWalletState = {
  deviceConnection: undefined,
  isLoading: false,
  error: undefined
};

export const ledgerWalletState$ = observable({
  ...InitialWalletState,
  async getDeviceConnection(): Promise<DeviceConnectionProps | undefined> {
    let { deviceConnection } = ledgerWalletState$.get();
    let transport: Transport | undefined =
      deviceConnection?.transport as unknown as Transport;

    ledgerWalletState$.isLoading.set(true);
    ledgerWalletState$.error.set(undefined);

    try {
      if (!transport) {
        transport = await TransportWebUSB.create();

        transport?.on('disconnect', () => {
          ledgerWalletState$.assign(InitialWalletState);
          console.log('disconnecting');
        });
      }

      const newDeviceConnection: DeviceConnectionProps = {
        transport
      };

      ledgerWalletState$.deviceConnection.set(newDeviceConnection);
      ledgerWalletState$.error.set(undefined);
      ledgerWalletState$.isLoading.set(false);
      return newDeviceConnection;
    } catch (e) {
      handleError(e, errorDetails.connection_error);
      return undefined;
    }
  },
  async connectDevice(): Promise<ConnectionResponse | undefined> {
    console.log('Attempting to connect device...');
    try {
      const { deviceConnection, getDeviceConnection } =
        ledgerWalletState$.get();

      ledgerWalletState$.isLoading.set(true);
      ledgerWalletState$.error.set(undefined);

      const transport = deviceConnection?.transport;

      if (!transport) {
        console.log(
          'No transport found, attempting to get device connection...'
        );
        const connection = await getDeviceConnection();
        if (!connection) {
          console.log('Failed to establish device connection');
          ledgerWalletState$.isLoading.set(false);
          return {
            connected: false,
            error: ledgerWalletState$.error.get()?.title
          };
        }
      }
      console.log('Device connected successfully');
      return { connected: true };
    } catch (e) {
      const error = handleError(e, errorDetails.connection_error);
      return {
        error: error.title,
        connected: false
      };
    }
  },
  clearConnection() {
    ledgerWalletState$.deviceConnection.set(undefined);
  },
  disconnect() {
    const { deviceConnection } = ledgerWalletState$.get();

    // Close the transport connection if it exists
    if (deviceConnection?.transport) {
      try {
        deviceConnection.transport.close();
        deviceConnection.transport.emit('disconnect');
      } catch (e) {
        handleError(e, errorDetails.disconnection_error);
      }
    }
  }
});
