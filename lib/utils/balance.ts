import { type Address, type AddressBalance, BalanceType, type NativeBalance, type NftBalance } from '@/state/types/ledger'

/**
 * Type guard to check if a balance is a native balance
 * @param balance - The balance to check
 * @returns true if the balance is a native balance
 */
export const isNativeBalance = (balance?: AddressBalance): balance is NativeBalance => {
  return Boolean(balance && balance.type === BalanceType.NATIVE)
}

/**
 * Type guard to check if a balance is an NFT or Unique balance
 * @param balance - The balance to check
 * @returns true if the balance is an NFT or Unique balance
 */
export const isNftBalance = (balance?: AddressBalance): balance is NftBalance => {
  return Boolean(balance && (balance.type === BalanceType.NFT || balance.type === BalanceType.UNIQUE))
}

/**
 * Checks if a balance is specifically an NFT balance type
 * @param balance - The balance to check
 * @returns true if the balance is an NFT balance type
 */
export const isNftBalanceType = (balance?: AddressBalance): boolean => {
  return Boolean(balance && balance.type === BalanceType.NFT)
}

/**
 * Checks if a balance is specifically a Unique balance type
 * @param balance - The balance to check
 * @returns true if the balance is a Unique balance type
 */
export const isUniqueBalanceType = (balance?: AddressBalance): boolean => {
  return Boolean(balance && balance.type === BalanceType.UNIQUE)
}

/**
 * Checks if a native balance has non-transferable funds by comparing transferable and total amounts
 * @param balance - The native balance to check
 * @returns true if transferable amount is less than total amount, indicating non-transferable funds exist
 */
export const hasNonTransferableBalance = (balance: NativeBalance): boolean => {
  return balance.balance.transferable < balance.balance.total
}

/**
 * Checks if a native balance has any staked funds
 * @param balance - The native balance to check
 * @returns true if the balance has staking information and total staked amount is greater than 0
 */
export const hasStakedBalance = (balance?: NativeBalance): boolean => {
  if (!balance || !balance.balance.staking) return false
  return Boolean(balance.balance.staking?.total && balance.balance.staking?.total > 0)
}

/**
 * Checks if a native balance can be unstaked
 * @param balance - The native balance to check
 * @returns true if the balance has staking information, can be unstaked, and has active staking
 */
export const canUnstake = (balance?: NativeBalance): boolean => {
  if (!balance || !balance.balance.staking) return false
  return Boolean(balance.balance.staking?.canUnstake && balance.balance.staking?.active !== 0)
}

/**
 * Checks if a collection of balances contains any non-zero values
 * @param balances Array of address balances to check
 * @returns True if any balance exists (native currency > 0 or collections with items)
 */
export const hasBalance = (balances: AddressBalance[], checkTransferable = false): boolean => {
  if (!balances) return false
  return balances.some(balance => {
    if (isNativeBalance(balance)) {
      return checkTransferable ? balance.balance.transferable > 0 : balance.balance.total > 0
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
