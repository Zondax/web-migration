import { ResponseVersion } from '@zondax/ledger-js'

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
 * @param {string} ticker - Optional ticker symbol to append.
 * @param {number} decimals - Optional decimal places to adjust the balance.
 * @returns {string} The formatted balance.
 */
export const formatBalance = (balance: number, ticker?: string, decimals?: number, maxDecimals?: number): string => {
  if (balance === 0) {
    return ticker ? `0 ${ticker}` : '0'
  }

  const adjustedBalance = decimals ? balance / Math.pow(10, decimals) : balance

  const formattedBalance = adjustedBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals !== undefined ? maxDecimals : 5,
  })

  return ticker ? `${formattedBalance} ${ticker}` : formattedBalance
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
