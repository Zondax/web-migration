import Transport from '@ledgerhq/hw-transport';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';

/**
 * Represents a response object from a connection request.
 */
export interface ConnectionResponse {
  error?: string;
  connected?: boolean;
}

/**
 * Represents the properties of a device connection.
 */
export interface DeviceConnectionProps {
  transport?: Transport;
  genericApp?: PolkadotGenericApp;
}

export type AddressStatus = 'synchronized' | 'migrated';

export type TransactionStatus =
  | 'pending'
  | 'inBlock'
  | 'finalized'
  | 'success'
  | 'failed'
  | 'error'
  | 'warning'
  | 'unknown'
  | 'completed'; // Add other statuses as needed

export interface Transaction {
  status?: TransactionStatus;
  statusMessage?: string;
  hash?: string;
  blockHash?: string;
  blockNumber?: string;
}

export interface Address extends GenericeResponseAddress {
  balance?: number;
  status?: AddressStatus;
  isLoading?: boolean;
  error?: {
    source: 'migration' | 'balance_fetch';
    description: string;
  };
  transaction?: Transaction;
}
