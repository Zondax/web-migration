import { AddressBalance, BalanceType, NativeBalance, NftBalance } from '@/state/types/ledger'

export const isNativeBalance = (balance?: AddressBalance): balance is NativeBalance => {
  return Boolean(balance && balance.type === BalanceType.NATIVE)
}

export const isNftBalance = (balance?: AddressBalance): balance is NftBalance => {
  return Boolean(balance && (balance.type === BalanceType.NFT || balance.type === BalanceType.UNIQUE))
}

export const isNftBalanceType = (balance?: AddressBalance): boolean => {
  return Boolean(balance && balance.type === BalanceType.NFT)
}

export const isUniqueBalanceType = (balance?: AddressBalance): boolean => {
  return Boolean(balance && balance.type === BalanceType.UNIQUE)
}

export const hasNonTransferableBalance = (balance: NativeBalance) => {
  return balance.balance.transferable < balance.balance.total
}

export const hasStakedBalance = (balance?: NativeBalance) => {
  if (!balance) return false
  return balance.balance.staking?.total && balance.balance.staking?.total > 0
}

export const canUnstake = (balance?: NativeBalance) => {
  if (!balance) return false
  return balance.balance.staking?.canUnstake && balance.balance.staking?.active !== 0
}
