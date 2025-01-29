import { ApiPromise, WsProvider } from '@polkadot/api';
import { errorDetails } from 'app/config/errors';
import axios from 'axios';

const mockBalances = [
  {
    address: 'obPSGcVmQPZzgWZrVM4fPMYAjJYuduNCYckAqqnnDDHf4Wr',
    balance: 2
  },
  {
    address: 'DzdDXY4xGGsPSYBf4Fv8kbaS3kdZNb9PX8DpKRsM3UuRhJ4',
    balance: 1
  },
  {
    address: '13M7fitxMYMVNfeG3e6mP4pcCteG4Wyf8kcew5TRN7PGm84C',
    balance: 4
  },
  {
    address: '4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL',
    error: true
  }
];

const errorAddresses = ['4hZ5p8eBqpynqxCZGYhaX22YX9a4XWDa3PUUXZKtTUQ38qrL'];

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
): Promise<{ result?: number; error?: string }> {
  const provider = new WsProvider(rpcEndpoint);
  const api = await ApiPromise.create({ provider });

  try {
    const balance = await api.query.system.account(address);
    console.log(
      'the balance for ',
      address,
      ': ',
      'data' in balance && 'free' in (balance as any).data
        ? parseFloat((balance.data as any).free.toString())
        : ' not found '
    );
    // TODO: Delete mock balance when there are accounts with tokens
    if (errorAddresses.includes(address)) {
      throw Error();
    }
    const mockBalance = mockBalances.find(
      (balance) => balance.address === address
    )?.balance;

    return {
      result: mockBalance
        ? mockBalance
        : 'data' in balance && 'free' in (balance as any).data
          ? parseFloat((balance.data as any).free.toString())
          : undefined
    };
  } catch (e) {
    return {
      error: errorDetails.balance_not_gotten.description
    };
  } finally {
    await api.disconnect();
  }
}

export const getAppLightIcon = async (appId: string) => {
  try {
    const hubUrl = process.env.NEXT_PUBLIC_HUB_BACKEND_URL;

    if (!hubUrl) {
      return;
    }

    const response = await axios.get(hubUrl + `/app/${appId}/icon/light`);
    return { data: response.data, error: undefined };
  } catch (error) {
    // TODO: capture exception
    return { data: [], error: 'error' };
  }
};
