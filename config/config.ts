/**
 * @constant truncateMaxCharacters
 * @description Maximum characters for truncation.
 */
export const truncateMaxCharacters = 16

/**
 * @constant maxAddressesToFetch
 * @description Maximum number of addresses to fetch from each app of the Ledger device. Can be set via NEXT_PUBLIC_MAX_ADDRESSES_TO_FETCH environment variable.
 */
export const maxAddressesToFetch =
  process.env.NEXT_PUBLIC_MAX_ADDRESSES_TO_FETCH && !Number.isNaN(Number.parseInt(process.env.NEXT_PUBLIC_MAX_ADDRESSES_TO_FETCH, 10))
    ? Number.parseInt(process.env.NEXT_PUBLIC_MAX_ADDRESSES_TO_FETCH, 10)
    : 10
