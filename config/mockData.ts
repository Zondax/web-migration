import { AppId } from './apps'

export const mockBalances =
  process.env.NEXT_PUBLIC_MOCK_BALANCES === 'true'
    ? [
        {
          address: 'obPSGcVmQPZzgWZrVM4fPMYAjJYuduNCYckAqqnnDDHf4Wr',
          balance: 2000000000,
        },
        // {
        //   address: 'Gq9CTYACKtgA1dyrM5yh7oDK6yh1P3ErjcxZvDmJu9YjdB5', // KUSAMA 1
        //   balance: 10000000003
        // },
        {
          address: 'EfEKXK3qtfDwMMV9Tc63ADoUdHdM1XrgeubH1PHh3TGzKXH', // KUSAMA 3
          balance: 30000000003,
        },
        {
          address: 'WVDmu85CwmEDHwyfVCfEX1WMeJc2ziRZBEi8WRPZU68GNbs', // ASTAR
          balance: 30000000003000000000,
        },
      ]
    : []

export const errorAddresses = process.env.NEXT_PUBLIC_ERROR_SYNC_ADDRESSES?.split(',') as string[]

export const syncApps = process.env.NEXT_PUBLIC_SYNC_APPS?.split(',') as AppId[]

export const errorApps = process.env.NEXT_PUBLIC_ERROR_SYNC_APPS?.split(',') as AppId[]

export const MINIMUM_AMOUNT = 100
