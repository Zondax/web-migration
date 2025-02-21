import { AppIds } from './apps';

export const mockBalances = [
  {
    address: 'obPSGcVmQPZzgWZrVM4fPMYAjJYuduNCYckAqqnnDDHf4Wr',
    balance: 2000000000
  },
  // {
  //   address: 'DzdDXY4xGGsPSYBf4Fv8kbaS3kdZNb9PX8DpKRsM3UuRhJ4', // KUSAMA
  //   balance: 1
  // },
  {
    address: 'WVDmu85CwmEDHwyfVCfEX1WMeJc2ziRZBEi8WRPZU68GNbs', // ASTAR
    balance: 30000000003000000000
  }
  // {
  //   address: '13M7fitxMYMVNfeG3e6mP4pcCteG4Wyf8kcew5TRN7PGm84C', // POLKADOT
  //   balance: 4
  // },
];

export const errorAddresses = [
  '4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL'
];

export const errorApps = [AppIds.EQUILIBRIUM];

export const MINIMUM_AMOUNT = 100;
