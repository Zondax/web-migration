import { MockTransport } from '@ledgerhq/hw-transport-mocker'
import TransportWebUSB from '@ledgerhq/hw-transport-webhid'
import { PolkadotGenericApp } from '@zondax/ledger-substrate'
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common'
import { describe, expect, it, vi } from 'vitest'

import { LedgerService } from '@/lib/ledger/ledgerService'

// Helper function to create mock responses
const createMockResponse = (statusCode: number) =>
  Buffer.concat([
    Buffer.from([]), // Empty data
    Buffer.from([statusCode >> 8, statusCode & 0xff]), // Status code
  ])

// Mock PolkadotGenericApp with required methods
const createMockGenericApp = (overrides: Partial<PolkadotGenericApp> = {}) =>
  ({
    getVersion: vi.fn(),
    ...overrides,
  }) as unknown as PolkadotGenericApp

describe('LedgerService', () => {
  describe('openApp', () => {
    it('should successfully open app and return connection', async () => {
      const transport = new MockTransport(createMockResponse(0x9000))
      const ledgerService = new LedgerService()

      const result = await ledgerService.openApp(transport, 'Polkadot Migration')
      expect(result).toEqual({ connection: { transport } })
    })

    it('should throw TransportStatusError when transport is undefined', async () => {
      const ledgerService = new LedgerService()
      await expect(ledgerService.openApp(undefined as any, 'Polkadot Migration')).rejects.toThrow('TransportStatusError')
    })
  })

  describe('initializeTransport', () => {
    it('should initialize transport and set up disconnect handler', async () => {
      // Mock TransportWebUSB.create to return our mock transport
      const mockTransport = new MockTransport(createMockResponse(0x9000))
      vi.spyOn(TransportWebUSB, 'create').mockResolvedValue(mockTransport as any)

      const ledgerService = new LedgerService()
      const onDisconnect = vi.fn()

      // Spy on handleDisconnect to verify it's called
      const handleDisconnectSpy = vi.spyOn(ledgerService as any, 'handleDisconnect')

      const transport = await ledgerService.initializeTransport(onDisconnect)

      // Verify transport is returned
      expect(transport).toBe(mockTransport)

      // Verify transport is stored in deviceConnection
      expect(ledgerService['deviceConnection'].transport).toBe(mockTransport)

      // Simulate disconnect
      transport.emit('disconnect')

      // Verify both handlers are called
      expect(handleDisconnectSpy).toHaveBeenCalled()
      expect(onDisconnect).toHaveBeenCalled()
    })

    it('should handle transport creation failure', async () => {
      // Mock TransportWebUSB.create to throw an error
      vi.spyOn(TransportWebUSB, 'create').mockRejectedValue(new Error('Failed to create transport'))

      const ledgerService = new LedgerService()

      // Verify the error is thrown
      await expect(ledgerService.initializeTransport()).rejects.toThrow('Failed to create transport')

      // Verify deviceConnection is not modified
      expect(ledgerService['deviceConnection'].transport).toBeUndefined()
    })
  })

  describe('isAppOpen', () => {
    it('should return true when app is open and version is returned', async () => {
      const ledgerService = new LedgerService()
      const genericApp = createMockGenericApp({
        getVersion: vi.fn().mockResolvedValue('1.0.0'),
      })

      const result = await ledgerService.isAppOpen(genericApp)
      expect(result).toBe(true)
      expect(genericApp.getVersion).toHaveBeenCalled()
    })

    it('should return false when app is not open (getVersion throws)', async () => {
      const ledgerService = new LedgerService()
      const genericApp = createMockGenericApp({
        getVersion: vi.fn().mockRejectedValue(new Error('App not open')),
      })

      const result = await ledgerService.isAppOpen(genericApp)
      expect(result).toBe(false)
      expect(genericApp.getVersion).toHaveBeenCalled()
    })

    it('should return false when version is undefined', async () => {
      const ledgerService = new LedgerService()
      const genericApp = createMockGenericApp({
        getVersion: vi.fn().mockResolvedValue(undefined),
      })

      const result = await ledgerService.isAppOpen(genericApp)
      expect(result).toBe(false)
      expect(genericApp.getVersion).toHaveBeenCalled()
    })
  })

  describe('connectDevice', () => {
    it('should connect device successfully when app is open', async () => {
      const ledgerService = new LedgerService()
      const mockTransport = new MockTransport(createMockResponse(0x9000))
      const mockGenericApp = createMockGenericApp()

      // Mock establishDeviceConnection to return a successful connection
      vi.spyOn(ledgerService, 'establishDeviceConnection').mockResolvedValue({
        transport: mockTransport,
        genericApp: mockGenericApp,
        isAppOpen: true,
      })

      const result = await ledgerService.connectDevice()

      expect(result).toEqual({
        connection: {
          transport: mockTransport,
          genericApp: mockGenericApp,
          isAppOpen: true,
        },
      })
    })

    it('should connect device successfully when app is closed', async () => {
      const ledgerService = new LedgerService()
      const mockTransport = new MockTransport(createMockResponse(0x9000))
      const mockGenericApp = createMockGenericApp()

      // Mock establishDeviceConnection to return a connection with closed app
      vi.spyOn(ledgerService, 'establishDeviceConnection').mockResolvedValue({
        transport: mockTransport,
        genericApp: mockGenericApp,
        isAppOpen: false,
      })

      const result = await ledgerService.connectDevice()

      expect(result).toEqual({
        connection: {
          transport: mockTransport,
          genericApp: mockGenericApp,
          isAppOpen: false,
        },
      })
    })

    it('should throw error when connection fails', async () => {
      const ledgerService = new LedgerService()

      // Mock establishDeviceConnection to return undefined (failed connection)
      vi.spyOn(ledgerService, 'establishDeviceConnection').mockResolvedValue(undefined)

      await expect(ledgerService.connectDevice()).rejects.toThrow('Failed to establish device connection')
    })
  })

  describe('getAccountAddress', () => {
    it('should get account address successfully when app is open', async () => {
      const ledgerService = new LedgerService()
      const mockAddress: GenericeResponseAddress = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        pubKey: 'mockPubKey',
      }

      const mockGenericApp = createMockGenericApp({
        getAddress: vi.fn().mockResolvedValue(mockAddress),
      })

      // Set up device connection
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: true,
      }

      const bip44Path = "m/44'/354'/0'/0/0'" // Valid Polkadot BIP44 path
      const result = await ledgerService.getAccountAddress(bip44Path, 0, true)

      expect(result).toEqual(mockAddress)
      expect(mockGenericApp.getAddress).toHaveBeenCalledWith(bip44Path, 0, true)
    })

    it('should throw error when app is not open', async () => {
      const ledgerService = new LedgerService()

      // Set up device connection with no genericApp
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: undefined,
        isAppOpen: false,
      }

      const bip44Path = "m/44'/354'/0'/0/0'" // Valid Polkadot BIP44 path
      await expect(ledgerService.getAccountAddress(bip44Path, 0, true)).rejects.toThrow('App not open')
    })

    it('should handle errors from getAddress call', async () => {
      const ledgerService = new LedgerService()
      const error = new Error('Failed to get address')

      const mockGenericApp = createMockGenericApp({
        getAddress: vi.fn().mockRejectedValue(error),
      })

      // Set up device connection
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: true,
      }

      const bip44Path = "m/44'/354'/0'/0/0'" // Valid Polkadot BIP44 path
      await expect(ledgerService.getAccountAddress(bip44Path, 0, true)).rejects.toThrow('Failed to get address')
    })
  })

  describe('signTransaction', () => {
    it('should sign transaction successfully when app is open', async () => {
      const ledgerService = new LedgerService()
      const mockSignature = Buffer.from('mockSignature')

      const mockGenericApp = createMockGenericApp({
        signWithMetadata: vi.fn().mockResolvedValue({ signature: mockSignature }),
      })

      // Set up device connection
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: true,
      }

      const bip44Path = "m/44'/354'/0'/0/0'"
      const payloadBytes = new Uint8Array([1, 2, 3])
      const chainId = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
      const proof1 = new Uint8Array([4, 5, 6])

      const result = await ledgerService.signTransaction(bip44Path, payloadBytes, chainId, proof1)

      expect(result).toEqual({ signature: mockSignature })
      expect(mockGenericApp.signWithMetadata).toHaveBeenCalledWith(bip44Path, Buffer.from(payloadBytes), Buffer.from(proof1))
      expect(mockGenericApp.txMetadataChainId).toBe(chainId)
    })

    it.skip('should throw error when app is not open', async () => {
      const ledgerService = new LedgerService()
      const mockGenericApp = createMockGenericApp({
        signWithMetadata: vi.fn().mockRejectedValue(new Error('28161')),
      })

      // Set up device connection with closed app
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: false,
      }

      const bip44Path = "m/44'/354'/0'/0/0'"
      const payloadBytes = new Uint8Array([1, 2, 3])
      const chainId = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
      const proof1 = new Uint8Array([4, 5, 6])

      await expect(ledgerService.signTransaction(bip44Path, payloadBytes, chainId, proof1)).rejects.toThrow('28161')
    })

    it('should handle errors from signWithMetadata call', async () => {
      const ledgerService = new LedgerService()
      const error = new Error('Failed to sign transaction')

      const mockGenericApp = createMockGenericApp({
        signWithMetadata: vi.fn().mockRejectedValue(error),
      })

      // Set up device connection
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: true,
      }

      const bip44Path = "m/44'/354'/0'/0/0'"
      const payloadBytes = new Uint8Array([1, 2, 3])
      const chainId = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
      const proof1 = new Uint8Array([4, 5, 6])

      await expect(ledgerService.signTransaction(bip44Path, payloadBytes, chainId, proof1)).rejects.toThrow('Failed to sign transaction')
    })

    it('should handle empty payload and proof', async () => {
      const ledgerService = new LedgerService()
      const mockSignature = Buffer.from('mockSignature')

      const mockGenericApp = createMockGenericApp({
        signWithMetadata: vi.fn().mockResolvedValue({ signature: mockSignature }),
      })

      // Set up device connection
      ledgerService['deviceConnection'] = {
        transport: new MockTransport(createMockResponse(0x9000)),
        genericApp: mockGenericApp,
        isAppOpen: true,
      }

      const bip44Path = "m/44'/354'/0'/0/0'"
      const payloadBytes = new Uint8Array([])
      const chainId = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3'
      const proof1 = new Uint8Array([])

      const result = await ledgerService.signTransaction(bip44Path, payloadBytes, chainId, proof1)

      expect(result).toEqual({ signature: mockSignature })
      expect(mockGenericApp.signWithMetadata).toHaveBeenCalledWith(bip44Path, Buffer.from(payloadBytes), Buffer.from(proof1))
    })
  })
})
