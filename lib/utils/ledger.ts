import axios from 'axios'
import { type App, AppStatus } from 'state/ledger'
import type { Address } from 'state/types/ledger'

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
 * Filters apps to only include those that have accounts that can be migrated.
 * This function filters for accounts that are selected and have not yet been migrated.
 *
 * @param apps - The apps to filter.
 * @returns Apps with accounts that can be migrated.
 */
export const filterSelectedAccountsForMigration = (apps: App[]): App[] => {
  return apps
    .map(app => ({
      ...app,
      accounts: app.accounts?.filter(account => account.selected && account.status !== 'migrated') || [],
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
 * Checks if the app has any accounts.
 *
 * @param app - The app to check.
 * @returns True if the app has accounts, false otherwise.
 */
export const hasAppAccounts = (app: App): boolean => {
  return Boolean(app.accounts && app.accounts.length > 0)
}

/**
 * Gets the total number of accounts with balances for a single app.
 *
 * @param app - The app to check.
 * @returns The number of accounts with balances for the app.
 */
export const getAppTotalAccounts = (app: App): number => {
  return app.accounts?.length || 0
}
