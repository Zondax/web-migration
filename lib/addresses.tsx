import {
  decodeAddress as decodeAddressPolkadot,
  encodeAddress as encodeAddressPolkadot
} from '@polkadot/keyring';
import { AppId, getChainPrefix } from '../app/config/apps';

/**
 * Converts an address from one network format to another by changing the SS58 prefix
 * @param address The source address to convert
 * @param prefix The SS58 prefix of the target network (e.g., 2 for Kusama, 0 for Polkadot)
 * @returns The address with the new network prefix
 */
export function convertSS58Format(address: string, prefix: number): string {
  // Decode the address
  const decoded = decodeAddressPolkadot(address);
  // Encode it with the provided prefix
  return encodeAddressPolkadot(decoded, prefix);
}

/**
 * Converts an address to a specific network format
 * @param address The source address to convert
 * @param appId The target application ID
 * @returns The address with the target network prefix or undefined if app not found
 */
export function convertAddressToNetwork(
  address: string,
  appId: AppId
): string | undefined {
  const prefix = getChainPrefix(appId);
  if (prefix === undefined) return undefined;
  return convertSS58Format(address, prefix);
}
