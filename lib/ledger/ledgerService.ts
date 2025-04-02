import Transport from '@ledgerhq/hw-transport'
import TransportWebUSB from '@ledgerhq/hw-transport-webhid'
import { LedgerError } from '@zondax/ledger-js'
import { PolkadotGenericApp } from '@zondax/ledger-substrate'
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { ConnectionResponse, DeviceConnectionProps } from 'state/types/ledger'

import { openApp } from './openApp'

/**
 * Interface for the Ledger service that manages device interaction
 */
export interface ILedgerService {
  openApp(transport: Transport, appName: string): Promise<{ connection?: DeviceConnectionProps }>
  initializeTransport(): Promise<Transport>
  isAppOpen(genericApp: PolkadotGenericApp): Promise<boolean>
  establishDeviceConnection(): Promise<DeviceConnectionProps | undefined>
  connectDevice(): Promise<ConnectionResponse | undefined>
  getAccountAddress(bip44Path: string, ss58prefix: number, showAddrInDevice: boolean): Promise<GenericeResponseAddress | undefined>
  signTransaction(
    bip44Path: string,
    payloadBytes: Uint8Array,
    chainId: string,
    proof1: Uint8Array
  ): Promise<{ signature?: Buffer<ArrayBufferLike> }>
  clearConnection(): void
  disconnect(): void
}

/**
 * Service that handles all Ledger device interactions
 * This class is agnostic of state management libraries
 */
export class LedgerService implements ILedgerService {
  private deviceConnection: DeviceConnectionProps = {
    transport: undefined,
    genericApp: undefined,
  }

  // Handles transport disconnection
  private handleDisconnect = () => {
    this.deviceConnection = {
      transport: undefined,
      genericApp: undefined,
    }
    console.log('disconnecting')
  }

  /**
   * Opens the Polkadot Migration app on the connected Ledger device
   */
  async openApp(transport: Transport, appName: string): Promise<{ connection?: DeviceConnectionProps }> {
    if (!transport) {
      throw new Error('TransportStatusError')
    }
    await openApp(transport, appName)
    return { connection: { transport } }
  }

  /**
   * Initializes the Ledger transport
   */
  async initializeTransport(onDisconnect?: () => void): Promise<Transport> {
    const transport = await TransportWebUSB.create()
    this.deviceConnection.transport = transport

    const handleDisconnect = () => {
      this.handleDisconnect()
      onDisconnect?.()
    }

    transport?.on('disconnect', handleDisconnect)
    return transport
  }

  /**
   * Checks if the app is open on the Ledger device
   */
  async isAppOpen(genericApp: PolkadotGenericApp): Promise<boolean> {
    try {
      const version = await genericApp.getVersion()
      return Boolean(version)
    } catch (error) {
      return false
    }
  }

  /**
   * Establishes a connection to the Ledger device
   */
  async establishDeviceConnection(onDisconnect?: () => void): Promise<DeviceConnectionProps | undefined> {
    const transport = this.deviceConnection.transport || (await this.initializeTransport(onDisconnect))
    const genericApp = this.deviceConnection.genericApp || new PolkadotGenericApp(transport)
    const isOpen = await this.isAppOpen(genericApp)

    if (!isOpen) {
      this.openApp(transport, 'Polkadot Migration')
      return { transport, genericApp, isAppOpen: false }
    }

    const connection = { transport, genericApp, isAppOpen: true }
    this.deviceConnection = connection
    return connection
  }

  /**
   * Connects to the Ledger device
   */
  async connectDevice(onDisconnect?: () => void): Promise<ConnectionResponse | undefined> {
    console.log('Attempting to connect device...')
    const connection = await this.establishDeviceConnection(onDisconnect)
    if (!connection) {
      console.log('Failed to establish device connection')
      throw new Error('Failed to establish device connection')
    }

    console.log(`Device connected successfully, the app is ${connection.isAppOpen ? 'open' : 'closed'}`)
    return { connection }
  }

  /**
   * Gets an account address from the Ledger device
   */
  async getAccountAddress(bip44Path: string, ss58prefix: number, showAddrInDevice: boolean): Promise<GenericeResponseAddress | undefined> {
    if (!this.deviceConnection?.genericApp) {
      throw new Error('App not open')
    }

    const genericApp = this.deviceConnection.genericApp as unknown as PolkadotGenericApp
    return await genericApp.getAddress(bip44Path, ss58prefix, showAddrInDevice)
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
      throw LedgerError.AppDoesNotSeemToBeOpen
    }

    const genericApp = this.deviceConnection.genericApp as unknown as PolkadotGenericApp

    genericApp.txMetadataChainId = chainId
    const { signature } = await genericApp.signWithMetadata(bip44Path, Buffer.from(payloadBytes), Buffer.from(proof1))
    return { signature }
  }

  /**
   * Clears the connection
   */
  clearConnection() {
    this.deviceConnection = {
      transport: undefined,
      genericApp: undefined,
    }
  }

  /**
   * Disconnects from the Ledger device
   */
  disconnect() {
    if (this.deviceConnection?.transport) {
      this.deviceConnection.transport.close()
      this.deviceConnection.transport.emit('disconnect')
    }
  }
}

// Export a singleton instance
export const ledgerService = new LedgerService()
