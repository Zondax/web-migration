import { AppIds } from './apps';

export const mockBalances = [
  {
    address: 'obPSGcVmQPZzgWZrVM4fPMYAjJYuduNCYckAqqnnDDHf4Wr',
    balance: 2
  },
  {
    address: 'DzdDXY4xGGsPSYBf4Fv8kbaS3kdZNb9PX8DpKRsM3UuRhJ4',
    balance: 1
  },
  {
    address: 'WVDmu85CwmEDHwyfVCfEX1WMeJc2ziRZBEi8WRPZU68GNbs', // ASTAR
    balance: 3
  },
  // {
  //   address: '13M7fitxMYMVNfeG3e6mP4pcCteG4Wyf8kcew5TRN7PGm84C', // POLKADOT
  //   balance: 4
  // },
  {
    address: '4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL',
    error: true
  }
];

export const errorAddresses = [
  '4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL'
];

export const errorApps = [AppIds.EQUILIBRIUM];
