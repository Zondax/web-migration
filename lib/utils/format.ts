import { ResponseVersion } from '@zondax/ledger-js'

import { Token } from '@/config/apps'

/**
 * Truncates the middle of a string to a specified maximum length.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length of the string.
 * @returns The truncated string, or null if the input string is empty.
 */
export const truncateMiddleOfString = (str: string, maxLength: number) => {
  if (!str) {
    return null
  }
  if (str.length <= maxLength) {
    return str
  }
  const middle = Math.floor(maxLength / 2)
  const start = str.substring(0, middle)
  const end = str.substring(str.length - middle, str.length)
  return `${start}...${end}`
}

/**
 * Formats a balance to a human-readable string.
 *
 * @param {number} balance - The balance to format.
 * @param {Token} token - Token information.
 * @param {number} maxDecimals - Optional maximum decimal places to display.
 * @returns {string} The formatted balance.
 */
export const formatBalance = (balance: number, token?: Token, maxDecimals?: number, hideTokenSymbol?: boolean): string => {
  if (balance === 0) {
    return hideTokenSymbol || !token ? '0' : `0 ${token?.symbol}`
  }

  const decimals = token?.decimals
  const adjustedBalance = decimals ? balance / Math.pow(10, decimals) : balance

  const formattedBalance = adjustedBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals !== undefined ? maxDecimals : 5,
  })
  return hideTokenSymbol || !token ? formattedBalance : `${formattedBalance} ${token?.symbol}`
}

/**
 * Formats a version object into a string.
 *
 * @param {ResponseVersion} version - The version object to format.
 * @returns {string} The formatted version string.
 */
export const formatVersion = (version: ResponseVersion): string => {
  const { major, minor, patch } = version
  return `${major}.${minor}.${patch}`
}
