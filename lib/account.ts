import { merkleizeMetadata } from '@polkadot-api/merkleize-metadata';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Option } from '@polkadot/types-codec';
import { OpaqueMetadata } from '@polkadot/types/interfaces';
import { ExtrinsicPayloadValue } from '@polkadot/types/types/extrinsic';
import { hexToU8a } from '@polkadot/util';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { AppConfig } from 'app/config/apps';
import { POLKADOT_GENERIC_API_METADATA_HASH } from 'app/config/config';
import { errorDetails } from 'app/config/errors';
import { errorAddresses, mockBalances } from 'app/config/mockData';
import axios from 'axios';

// Return type for the getBalance function
interface GetBalanceResult {
  result?: number;
  error?: string;
}

/**
 * Retrieves the balance of a given address from a specified RPC endpoint.
 *
 * @param {string} address - The address for which the balance is to be retrieved.
 * @param {string} rpcEndpoint - The WebSocket endpoint of the blockchain node.
 * @returns {Promise<GetBalanceResult>} - The balance of the address or undefined if not found.
 */
export async function getBalance(
  address: string,
  rpcEndpoint: string
): Promise<GetBalanceResult> {
  let provider: WsProvider | undefined;
  let api: ApiPromise | undefined;

  try {
    provider = new WsProvider(rpcEndpoint);
    api = await ApiPromise.create({ provider });

    const balance = await api.query.system.account(address);

    // The `as any` is a bit of a hack.  A better solution would involve
    // defining types for the balance data.  But this works for now.
    const freeBalance =
      'data' in balance && 'free' in (balance as any).data
        ? parseFloat((balance.data as any).free.toString())
        : undefined;

    // TODO: Delete mock balance when there are accounts with tokens
    if (errorAddresses.includes(address)) {
      throw new Error('Address in error list'); // More specific error
    }
    const mockBalance = mockBalances.find(
      (balance) => balance.address === address
    )?.balance;

    return {
      result: mockBalance ?? freeBalance
    };
  } catch (e) {
    console.error('Error getting balance:', e);
    return {
      error: errorDetails.balance_not_gotten.description
    };
  } finally {
    // Check if api exists before disconnecting.
    if (api) {
      await api.disconnect();
    } else if (provider) {
      // If ApiPromise creation failed, disconnect the provider directly.
      await provider.disconnect();
    }
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

export const createGenericApiTransfer = async (
  genericApp: PolkadotGenericApp,
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  polkadotConfig: AppConfig,
  appConfig: AppConfig,
  index: number
) => {
  const provider = new WsProvider(appConfig.rpcEndpoint);
  const api = await ApiPromise.create({ provider });

  try {
    // Define sender and receiver addresses and the amount to transfer
    const amount = 1_000_000_000_000; // TODO: delete it when we have amount in any account

    console.log('sender address ' + senderAddress);
    console.log('receiver address ' + receiverAddress);
    const nonceResp = await api.query.system.account(senderAddress);
    const { nonce } = nonceResp.toHuman() as any;
    console.log('nonce ' + nonce);

    // Create the transfer transaction
    const transfer = api.tx.balances.transferKeepAlive(receiverAddress, amount);
    console.log('ticker ', appConfig.ticker.toLowerCase());
    const resp = await axios.post(POLKADOT_GENERIC_API_METADATA_HASH, {
      id: appConfig.ticker.toLowerCase()
    });

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
      metadataHash: hexToU8a('01' + resp.data.metadataHash) // "01" indicates the field is sent, "00" indicated the field is not sent.
    });

    console.log(
      'payload to sign[hex] ' + Buffer.from(payload.toU8a(true)).toString('hex')
    );
    console.log(
      'payload to sign[human] ' + JSON.stringify(payload.toHuman(true))
    );

    const bip44Path = getBip44Path(polkadotConfig.bip44Path, index);
    // Request signature from Ledger
    // Remove first byte as it indicates the length, and it is not supported by shortener and ledger app
    genericApp.txMetadataChainId = appConfig.ticker.toLowerCase();
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

export const createTransfer = async (
  genericApp: PolkadotGenericApp,
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  polkadotConfig: AppConfig,
  appConfig: AppConfig,
  index: number
) => {
  const provider = new WsProvider(appConfig.rpcEndpoint);
  const api = await ApiPromise.create({ provider });

  try {
    console.log('sender address ' + senderAddress);
    console.log('receiver address ' + receiverAddress);
    // Define nonce and the amount to transfer
    const nonceResp = await api.query.system.account(senderAddress);
    const { nonce } = nonceResp.toHuman() as any;
    console.log('nonce ' + nonce);
    const amount = 1_000_000_000_000; // TODO: delete it when we have amount in any account

    const metadataV15 = await api.call.metadata
      .metadataAtVersion<Option<OpaqueMetadata>>(15)
      .then((m) => {
        if (!m.isNone) {
          return m.unwrap();
        }
      });
    if (!metadataV15) return;

    const merkleizedMetadata = merkleizeMetadata(metadataV15, {
      decimals: appConfig.decimals,
      tokenSymbol: appConfig.ticker
    });

    const metadataHash = merkleizedMetadata.digest();
    // Create the transfer transaction
    const transfer = api.tx.balances.transferKeepAlive(receiverAddress, amount);

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
      metadataHash: hexToU8a('01' + Buffer.from(metadataHash).toString('hex'))
    });

    // Request signature from Ledger
    // Remove first byte as it indicates the length, and it is not supported by shortener and ledger app
    const bip44Path = getBip44Path(polkadotConfig.bip44Path, index);
    const payloadBytes = payload.toU8a(true);
    genericApp.txMetadataChainId = appConfig.ticker.toLowerCase();
    const proof1: Uint8Array =
      merkleizedMetadata.getProofForExtrinsicPayload(payloadBytes);
    const { signature } = await genericApp.signWithMetadata(
      bip44Path,
      Buffer.from(payloadBytes),
      Buffer.from(proof1)
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
      metadataHash: hexToU8a('01' + Buffer.from(metadataHash).toString('hex'))
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
