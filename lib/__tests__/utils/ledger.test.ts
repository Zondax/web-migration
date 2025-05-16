import { App } from 'state/ledger'
import { Address } from 'state/types/ledger'
import { describe, expect, it } from 'vitest'

import { filterAppsWithErrors, filterAppsWithoutErrors, hasAccountsWithErrors, hasAddressBalance } from '../../utils/ledger'
import {
  mockAddress1,
  mockAddress2,
  mockAddress3,
  mockAddressNoBalance,
  mockAddressPartialBalance,
  mockAddressWithError,
  mockApp1,
  mockApp2,
  mockAppMixedErrorTypes,
  mockAppNoAccounts,
  mockApps,
  mockAppWithAppError,
  mockAppWithMigrationError,
  mockNft1,
  mockUnique,
} from './__mocks__/mockData'

// =========== Helper Functions ===========
const getAppById = (apps: App[], id: string) => apps.find(app => app.id === id)
const getAccountByPath = (accounts: Address[], path: string) => accounts.find(account => account.path === path)

// =========== Tests: filterAppsWithoutErrors ===========
describe('filterAppsWithoutErrors', () => {
  it('should filter out apps with errors', () => {
    const result = filterAppsWithoutErrors(mockApps)
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('App 1')
    expect(result[1].name).toBe('App 2')
    expect(result[2].name).toBe('App 3') // This app has only migration errors which are allowed
  })

  it('should filter out accounts with errors within apps', () => {
    const result = filterAppsWithoutErrors(mockApps)
    expect(result[0].accounts).toHaveLength(2)
    const app2Filtered = getAppById(result, 'kusama')
    expect(app2Filtered?.accounts?.length).toBe(1) // App2 should have only one account left
  })

  it('should handle empty apps array', () => {
    const result = filterAppsWithoutErrors([])
    expect(result).toHaveLength(0)
  })

  it('should handle apps with no accounts', () => {
    const appsWithNoAccounts = [{ ...mockApp1, accounts: [] }]
    const result = filterAppsWithoutErrors(appsWithNoAccounts)
    expect(result).toHaveLength(0)
  })

  it('should handle apps with undefined accounts property', () => {
    const appsWithUndefinedAccounts = [{ ...mockApp1, accounts: undefined }]
    const result = filterAppsWithoutErrors(appsWithUndefinedAccounts)
    expect(result).toHaveLength(0)
  })

  it('should retain accounts with migration errors', () => {
    const result = filterAppsWithoutErrors([mockAppWithMigrationError])
    expect(result).toHaveLength(1)
    expect(result[0].accounts).toHaveLength(1)
    if (result[0].accounts?.[0].error) {
      expect(result[0].accounts[0].error.source).toBe('migration')
    }
  })
})

// =========== Tests: filterAppsWithErrors ===========
describe('filterAppsWithErrors', () => {
  it('should filter out apps without errors', () => {
    const appWithNoErrors = { ...mockApp1, accounts: [mockAddress1, mockAddress2] }
    const result = filterAppsWithErrors([appWithNoErrors, mockAppWithAppError])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('App 4')
  })

  it('should include apps with account errors', () => {
    const result = filterAppsWithErrors(mockApps)
    expect(result).toHaveLength(2) // App2 has account errors, App4 has app-level errors
    expect(getAppById(result, 'kusama')).toBeDefined()
    expect(getAppById(result, 'acala')).toBeDefined()
    // App3 has migration errors which should be filtered out by filterAppsWithErrors
    expect(getAppById(result, 'westend')).toBeUndefined()
  })

  it('should handle empty apps array', () => {
    const result = filterAppsWithErrors([])
    expect(result).toHaveLength(0)
  })

  it('should handle apps with no accounts', () => {
    const result = filterAppsWithErrors([mockAppNoAccounts])
    expect(result).toHaveLength(0)
  })

  it('should handle apps with undefined accounts property', () => {
    const appsWithUndefinedAccounts = [{ ...mockAppWithAppError, accounts: undefined }]
    const result = filterAppsWithErrors(appsWithUndefinedAccounts)
    expect(result).toHaveLength(1) // Still has the app error
  })

  it('should include apps with app-level errors', () => {
    const result = filterAppsWithErrors([mockAppWithAppError])
    expect(result).toHaveLength(1)
    if (result[0].error) {
      expect(result[0].error.source).toBe('synchronization')
    }
  })

  it('should include apps with mixed error types', () => {
    const result = filterAppsWithErrors([mockAppMixedErrorTypes])
    expect(result).toHaveLength(1)
    // mockAppMixedErrorTypes has 3 accounts: mockAddress1 (no error),
    // mockAddressWithError (balance_fetch error), and mockAddressWithMigrationError (migration error)
    // filterAppsWithErrors should only include the account with balance_fetch error
    // and filter out the account with migration error
    expect(result[0].accounts?.length).toBe(1)
    expect(result[0].accounts?.[0].error?.source).toBe('balance_fetch')
  })
})

// =========== Tests: hasAccountsWithErrors ===========
describe('hasAccountsWithErrors', () => {
  it('should return true if any account has an error', () => {
    expect(hasAccountsWithErrors([mockApp2])).toBe(true)
  })

  it('should return false if no accounts have errors', () => {
    expect(hasAccountsWithErrors([mockApp1])).toBe(false)
  })

  it('should return false for migration errors', () => {
    expect(hasAccountsWithErrors([mockAppWithMigrationError])).toBe(false)
  })

  it('should handle empty accounts array', () => {
    expect(hasAccountsWithErrors([mockAppNoAccounts])).toBe(false)
  })

  it('should handle undefined accounts property', () => {
    const appWithUndefinedAccounts = { ...mockApp1, accounts: undefined }
    expect(hasAccountsWithErrors([appWithUndefinedAccounts])).toBe(false)
  })

  it('should handle accounts with undefined error property', () => {
    const accountWithUndefinedError = { ...mockAddress1, error: undefined }
    const appWithAccountWithUndefinedError = { ...mockApp1, accounts: [accountWithUndefinedError] }
    expect(hasAccountsWithErrors([appWithAccountWithUndefinedError])).toBe(false)
  })

  it('should handle app with mixed account error types', () => {
    expect(hasAccountsWithErrors([mockAppMixedErrorTypes])).toBe(true)
  })
})

// =========== Tests: hasBalance ===========
describe('hasBalance', () => {
  it('should return true if address has native balance', () => {
    expect(hasAddressBalance(mockAddress1)).toBe(true)
  })

  it('should return true if address has NFTs', () => {
    expect(hasAddressBalance(mockAddress2)).toBe(true)
  })

  it('should return true if address has uniques', () => {
    expect(hasAddressBalance(mockAddress3)).toBe(true)
  })

  it('should return false if address has no balance', () => {
    expect(hasAddressBalance(mockAddressNoBalance)).toBe(false)
  })

  it('should return false for address with undefined balance', () => {
    expect(hasAddressBalance(mockAddressWithError)).toBe(false)
  })

  it('should handle partial balance objects', () => {
    expect(hasAddressBalance(mockAddressPartialBalance)).toBe(false)
  })

  it('should handle balance with only uniques property', () => {
    const addressWithOnlyUniques: Address = {
      ...mockAddress1,
      balance: {
        uniques: [mockUnique],
      },
    }
    expect(hasAddressBalance(addressWithOnlyUniques)).toBe(true)
  })

  it('should handle balance with only nfts property', () => {
    const addressWithOnlyNfts: Address = {
      ...mockAddress1,
      balance: {
        nfts: [mockNft1],
      },
    }
    expect(hasAddressBalance(addressWithOnlyNfts)).toBe(true)
  })

  it('should handle balance with only native property', () => {
    const addressWithOnlyNative: Address = {
      ...mockAddress1,
      balance: {
        native: 100,
      },
    }
    expect(hasAddressBalance(addressWithOnlyNative)).toBe(true)
  })

  it('should return false for zero native balance and empty arrays', () => {
    const addressWithZeroBalances: Address = {
      ...mockAddress1,
      balance: {
        native: 0,
        nfts: [],
        uniques: [],
      },
    }
    expect(hasAddressBalance(addressWithZeroBalances)).toBe(false)
  })
})
