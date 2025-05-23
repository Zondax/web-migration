import axios from 'axios'
import { type App, AppStatus } from 'state/ledger'
import { type Address, type AddressBalance, BalanceType } from 'state/types/ledger'

/**
 * Retrieves a light icon for a given app from the Hub backend.
 *
 * @param appId - The ID of the app to retrieve the icon for.
 * @returns The icon data and any error that occurred.
 */
export const getAppLightIcon = async (appId: string) => {
  try {
    // First try to fetch from API
    const hubUrl = process.env.NEXT_PUBLIC_HUB_BACKEND_URL

    if (!hubUrl) {
      return { data: undefined, error: 'Hub URL not configured' }
    }

    try {
      const response = await axios.get(`${hubUrl}/app/${appId}/icon/light`)
      return { data: response.data, error: undefined }
    } catch (apiError) {
      // API call failed, try local image as fallback
    }

    // If API fetch fails, check if the image exists locally
    const localImagePath = `/logos/chains/${appId}.svg`

    try {
      const res = await fetch(localImagePath)
      if (res.ok) {
        // For SVG files, we need to get the text content
        const svgContent = await res.text()
        return { data: svgContent, error: undefined }
      }
    } catch (localError) {
      // Local image doesn't exist either
    }

    // If we get here, both API and local fetches failed
    return { data: undefined, error: 'Icon not found' }
  } catch (error) {
    return { data: undefined, error: 'Error fetching app icon' }
  }
}

/**
 * Filters apps to only include those without errors.
 *
 * @param apps - The apps to filter.
 * @returns Apps without errors.
 */
export const filterAppsWithoutErrors = (apps: App[]): App[] => {
  return apps
    .map(app => ({
      ...app,
      accounts: app.accounts?.filter((account: Address) => !account.error || account.error?.source === 'migration') || [],
    }))
    .filter(app => app.accounts.length > 0)
}

/**
 * Filters apps to only include those with errors.
 *
 * @param apps - The apps to filter.
 * @returns Apps with errors.
 */
export const filterAppsWithErrors = (apps: App[]): App[] => {
  return apps
    .map(app => ({
      ...app,
      accounts: app.accounts?.filter((account: Address) => account.error && account.error?.source !== 'migration') || [],
    }))
    .filter(app => app.accounts.length > 0 || app.status === 'error')
}

/**
 * Checks if there are any accounts with errors.
 *
 * @param apps - The apps to check.
 * @returns True if there are accounts with errors, false otherwise.
 */
export const hasAccountsWithErrors = (apps: App[]): boolean => {
  return apps.some(
    app =>
      app.error?.source === 'synchronization' ||
      app.status === AppStatus.RESCANNING ||
      app.accounts?.some(account => account.error && account.error?.source !== 'migration')
  )
}

/**
 * Checks if a collection of balances contains any non-zero values
 * @param balances Array of address balances to check
 * @returns True if any balance exists (native currency > 0 or collections with items)
 */
export const hasBalance = (balances: AddressBalance[]): boolean => {
  if (!balances) return false
  return balances.some(balance => {
    if (balance.type === BalanceType.NATIVE) {
      return balance.balance > 0
    }
    return Array.isArray(balance.balance) && balance.balance.length > 0
  })
}

/**
 * Checks if an account has any balance (native, NFTs, or uniques)
 * @param account The account to check
 * @returns True if the account has any balance, false otherwise
 */
export const hasAddressBalance = (account: Address): boolean => {
  if (!account.balances) return false
  return hasBalance(account.balances)
}
