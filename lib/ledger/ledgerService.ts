import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webhid';
import { LedgerError, ResponseVersion } from '@zondax/ledger-js';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { ConnectionResponse, DeviceConnectionProps } from 'state/types/ledger';
import { openApp } from './openApp';

/**
 * Interface for the Ledger service that manages device interaction
 */
export interface ILedgerService {
  openApp(
    transport: Transport,
    appName: string
  ): Promise<{ connection?: DeviceConnectionProps }>;
  initializeTransport(): Promise<Transport>;
  getAppVersion(
    genericApp: PolkadotGenericApp
  ): Promise<ResponseVersion | undefined>;
  establishDeviceConnection(): Promise<DeviceConnectionProps | undefined>;
  connectDevice(): Promise<ConnectionResponse | undefined>;
  getAccountAddress(
    bip44Path: string,
    ss58prefix: number,
    showAddrInDevice: boolean
  ): Promise<GenericeResponseAddress | undefined>;
  signTransaction(
    bip44Path: string,
    payloadBytes: Uint8Array,
    chainId: string,
    proof1: Uint8Array
  ): Promise<{ signature?: Buffer<ArrayBufferLike> }>;
  clearConnection(): void;
  disconnect(): void;
}

/**
 * Service that handles all Ledger device interactions
 * This class is agnostic of state management libraries
 */
export class LedgerService implements ILedgerService {
  private deviceConnection: DeviceConnectionProps = {
    transport: undefined,
    genericApp: undefined
  };

  // Handles transport disconnection
  private handleDisconnect = () => {
    this.deviceConnection = {
      transport: undefined,
      genericApp: undefined
    };
    console.log('disconnecting');
  };

  /**
   * Opens the Polkadot Migration app on the connected Ledger device
   */
  async openApp(
    transport: Transport,
    appName: string
  ): Promise<{ connection?: DeviceConnectionProps }> {
    if (!transport) {
      throw new Error('TransportStatusError');
    }
    await openApp(transport, appName);
    return { connection: { transport } };
  }

  /**
   * Initializes the Ledger transport
   */
  async initializeTransport(): Promise<Transport> {
    const transport = await TransportWebUSB.create();
    this.deviceConnection.transport = transport;
    transport?.on('disconnect', this.handleDisconnect);
    return transport;
  }

  /**
   * Gets the version of the open app
   */
  async getAppVersion(
    genericApp: PolkadotGenericApp
  ): Promise<ResponseVersion | undefined> {
    const versionResult = await genericApp.getVersion();
    return versionResult;
  }

  /**
   * Establishes a connection to the Ledger device
   */
  async establishDeviceConnection(): Promise<
    DeviceConnectionProps | undefined
  > {
    let transport = await this.initializeTransport();
    let genericApp = new PolkadotGenericApp(transport);

    // Attempt to get version, which implicitly checks if the app is open
    let version = await this.getAppVersion(genericApp);

    if (!version) {
      await this.openApp(transport, 'Polkadot Migration');
      version = await this.getAppVersion(genericApp);
      if (!version) return undefined;
    }

    const connection = { transport, genericApp };
    this.deviceConnection = connection;
    return connection;
  }

  /**
   * Connects to the Ledger device
   */
  async connectDevice(): Promise<ConnectionResponse | undefined> {
    console.log('Attempting to connect device...');
    const connection = await this.establishDeviceConnection();
    if (!connection) {
      console.log('Failed to establish device connection');
      throw new Error('Failed to establish device connection');
    }

    console.log('Device connected successfully');
    return { connection };
  }

  /**
   * Gets an account address from the Ledger device
   */
  async getAccountAddress(
    bip44Path: string,
    ss58prefix: number,
    showAddrInDevice: boolean
  ): Promise<GenericeResponseAddress | undefined> {
    if (!this.deviceConnection?.genericApp) {
      throw new Error('App not open');
    }

    const genericApp = this.deviceConnection
      .genericApp as unknown as PolkadotGenericApp;
    return await genericApp.getAddress(bip44Path, ss58prefix, showAddrInDevice);
  }

  /**
   * Migrates an account
   */
  async signTransaction(
    bip44Path: string,
    payloadBytes: Uint8Array,
    chainId: string,
    proof1: Uint8Array
  ): Promise<{ signature?: Buffer<ArrayBufferLike> }> {
    if (!this.deviceConnection?.genericApp) {
      throw LedgerError.AppDoesNotSeemToBeOpen;
    }

    const genericApp = this.deviceConnection
      .genericApp as unknown as PolkadotGenericApp;

    genericApp.txMetadataChainId = chainId;
    const { signature } = await genericApp.signWithMetadata(
      bip44Path,
      Buffer.from(payloadBytes),
      Buffer.from(proof1)
    );
    return { signature };
  }

  /**
   * Clears the connection
   */
  clearConnection() {
    this.deviceConnection = {
      transport: undefined,
      genericApp: undefined
    };
  }

  /**
   * Disconnects from the Ledger device
   */
  disconnect() {
    if (this.deviceConnection?.transport) {
      this.deviceConnection.transport.close();
      this.deviceConnection.transport.emit('disconnect');
    }
  }
}

// Export a singleton instance
export const ledgerService = new LedgerService();
