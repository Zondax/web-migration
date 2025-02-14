import { ApiPromise, WsProvider } from '@polkadot/api';
import { ExtrinsicPayloadValue } from '@polkadot/types/types/extrinsic';
import { hexToU8a } from '@polkadot/util';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { AppConfig } from 'app/config/apps';
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
  // {
  //   address: '13M7fitxMYMVNfeG3e6mP4pcCteG4Wyf8kcew5TRN7PGm84C',
  //   balance: 4
  // },
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

export const createTransfer = async (
  genericApp: PolkadotGenericApp,
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  config: AppConfig,
  ticker: string,
  index: number
) => {
  const provider = new WsProvider(config.rpcEndpoint);
  const api = await ApiPromise.create({ provider });

  try {
    console.log('sender address ' + senderAddress);
    const nonceResp = await api.query.system.account(senderAddress);
    const { nonce } = nonceResp.toHuman() as any;
    console.log('nonce ' + nonce);

    // Create the transfer transaction
    const transfer = api.tx.balances.transferKeepAlive(receiverAddress, amount);

    const resp = await axios.post(
      'https://api.zondax.ch/polkadot/node/metadata/hash',
      { id: ticker }
    );

    console.log('metadata hash ' + resp.data.metadataHash);

    // Create the payload for signing
    const payload = api.createType('ExtrinsicPayload', {
      method: transfer.method.toHex(),
      nonce: nonce as unknown as number,
      genesisHash: api.genesisHash,
      blockHash: api.genesisHash,
      transactionVersion: api.runtimeVersion.transactionVersion,
      specVersion: api.runtimeVersion.specVersion,
      runtimeVersion: api.runtimeVersion,
      version: api.extrinsicVersion,
      mode: 1,
      metadataHash: hexToU8a('01' + resp.data.metadataHash) // TODO: Analize if "01" should be fixed or not
    });

    console.log(
      'payload to sign[hex] ' + Buffer.from(payload.toU8a(true)).toString('hex')
    );
    console.log(
      'payload to sign[human] ' + JSON.stringify(payload.toHuman(true))
    );

    const bip44Path = getBip44Path(config.bip44Path, index);
    // Request signature from Ledger
    // Remove first byte as it indicates the length, and it is not supported by shortener and ledger app
    genericApp.txMetadataChainId = config.ticker;
    const { signature } = await genericApp.sign(
      bip44Path,
      Buffer.from(payload.toU8a(true))
    );

    console.log('signature ' + signature.toString('hex'));

    const payloadValue: ExtrinsicPayloadValue = {
      era: payload.era,
      genesisHash: api.genesisHash,
      blockHash: api.genesisHash,
      method: transfer.method.toHex(),
      nonce: nonce as unknown as number,
      specVersion: api.runtimeVersion.specVersion,
      tip: 0,
      transactionVersion: api.runtimeVersion.transactionVersion,
      mode: 1,
      metadataHash: hexToU8a('01' + resp.data.metadataHash)
    };

    // Combine the payload and signature to create a signed extrinsic
    const signedExtrinsic = transfer.addSignature(
      senderAddress,
      signature,
      payloadValue
    );

    console.log(
      'signedTx to broadcast[hex] ' +
        Buffer.from(signedExtrinsic.toU8a()).toString('hex')
    );
    console.log(
      'signedTx to broadcast[human] ' +
        JSON.stringify(signedExtrinsic.toHuman(true))
    );

    // Submit the signed transaction
    await transfer.send((status) => {
      console.log(`Tx status: ${JSON.stringify(status)}`);
    });
  } catch (error) {
    console.error('Error during transfer:', error);
    throw new Error(
      'Transfer failed: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  } finally {
    await api.disconnect();
  }
};

export const getBip44Path = (bip44Path: string, index: number) =>
  bip44Path.replace(/\/0'$/, `/${index}'`);
