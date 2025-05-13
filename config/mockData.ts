import { AppId } from './apps'

export const mockBalances = process.env.NEXT_PUBLIC_MOCK_BALANCES
  ? process.env.NEXT_PUBLIC_MOCK_BALANCES.split(',').map(pair => {
      const [address, balanceStr] = pair.split(':')
      return {
        address,
        balance: Number(balanceStr),
      }
    })
  : []

export const errorAddresses = process.env.NEXT_PUBLIC_ERROR_SYNC_ADDRESSES?.split(',') as string[]

export const syncApps = process.env.NEXT_PUBLIC_SYNC_APPS?.split(',') as AppId[]

export const errorApps = process.env.NEXT_PUBLIC_ERROR_SYNC_APPS?.split(',') as AppId[]

export const MINIMUM_AMOUNT = process.env.NEXT_PUBLIC_NATIVE_TRANSFER_AMOUNT
  ? parseInt(process.env.NEXT_PUBLIC_NATIVE_TRANSFER_AMOUNT)
  : undefined
