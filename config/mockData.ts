import { AppId } from './apps';

export const mockBalances = [
  {
    address: 'obPSGcVmQPZzgWZrVM4fPMYAjJYuduNCYckAqqnnDDHf4Wr',
    balance: 2000000000
  },
  // {
  //   address: 'DzdDXY4xGGsPSYBf4Fv8kbaS3kdZNb9PX8DpKRsM3UuRhJ4', // KUSAMA 0
  //   balance: 1
  // },
  {
    address: 'Gq9CTYACKtgA1dyrM5yh7oDK6yh1P3ErjcxZvDmJu9YjdB5', // KUSAMA 1
    balance: 10000000003
  },
  {
    address: 'EfEKXK3qtfDwMMV9Tc63ADoUdHdM1XrgeubH1PHh3TGzKXH', // KUSAMA 3
    balance: 30000000003
  },
  {
    address: 'WVDmu85CwmEDHwyfVCfEX1WMeJc2ziRZBEi8WRPZU68GNbs', // ASTAR
    balance: 30000000003000000000
  }
];

export const errorAddresses = [
  '4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL'
];

export const errorApps = ['acala' as AppId];

export const MINIMUM_AMOUNT = 100;
