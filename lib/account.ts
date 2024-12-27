import { ApiPromise, WsProvider } from '@polkadot/api';

/**
 * Retrieves the balance of a given address from a specified RPC endpoint.
 *
 * @param {string} address - The address for which the balance is to be retrieved.
 * @param {string} rpcEndpoint - The WebSocket endpoint of the blockchain node.
 * @returns {Promise<number | undefined>} - The balance of the address or undefined if not found.
 */
export async function getBalance(
  address: string,
  rpcEndpoint: string
): Promise<number | undefined> {
  const provider = new WsProvider(rpcEndpoint);
  const api = await ApiPromise.create({ provider });

  try {
    console.log('getting balance, address ', address);
    const balance = await api.query.system.account(address);
    console.log(
      'the balance for ',
      address,
      ': ',
      'data' in balance && 'free' in (balance as any).data
        ? parseFloat((balance.data as any).free.toString())
        : ' not found '
    );
    return 'data' in balance && 'free' in (balance as any).data
      ? parseFloat((balance.data as any).free.toString())
      : undefined;
  } catch (e) {
    console.log('The balance could not be gotten ', e);
  } finally {
    await api.disconnect();
  }
}
