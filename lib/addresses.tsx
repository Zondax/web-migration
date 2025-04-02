import { decodeAddress as decodeAddressPolkadot, encodeAddress as encodeAddressPolkadot } from '@polkadot/keyring'

/**
 * Converts an address from one network format to another by changing the SS58 prefix
 * @param address The source address to convert
 * @param prefix The SS58 prefix of the target network (e.g., 2 for Kusama, 0 for Polkadot)
 * @returns The address with the new network prefix
 */
export function convertSS58Format(address: string, prefix: number): string {
  // Decode the address
  const decoded = decodeAddressPolkadot(address)
  // Encode it with the provided prefix
  return encodeAddressPolkadot(decoded, prefix)
}
