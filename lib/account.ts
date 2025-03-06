import {
  merkleizeMetadata,
  MetadataMerkleizer
} from '@polkadot-api/merkleize-metadata';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { GenericExtrinsicPayload } from '@polkadot/types';
import { Option } from '@polkadot/types-codec';
import { Hash, OpaqueMetadata } from '@polkadot/types/interfaces';
import {
  ExtrinsicPayloadValue,
  ISubmittableResult
} from '@polkadot/types/types/extrinsic';
import { hexToU8a } from '@polkadot/util';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { AppConfig } from 'app/config/apps';
import { errorDetails } from 'app/config/errors';
import {
  errorAddresses,
  MINIMUM_AMOUNT,
  mockBalances
} from 'app/config/mockData';
import { Address, TransactionStatus } from 'app/state/types/ledger';

// Return type for the getBalance function
interface GetBalanceResult {
  result?: number;
  error?: string;
}

// Get API and Provider
async function getApiAndProvider(
  rpcEndpoint?: string
): Promise<{ api?: ApiPromise; provider?: WsProvider; error?: string }> {
  try {
    const provider = new WsProvider(rpcEndpoint);
    const api = await ApiPromise.create({ provider });
    return { api, provider };
  } catch (e) {
    console.error('Error creating API:', e);
    return { error: 'Failed to connect to the blockchain.' };
  }
}

// Get Balance (simplified error handling)
export async function getBalance(
  address: GenericeResponseAddress,
  rpcEndpoint: string
): Promise<Address> {
  const { api, provider, error } = await getApiAndProvider(rpcEndpoint);
  const { address: addressString } = address;

  if (error) {
    return {
      ...address,
      balance: undefined,
      status: 'synchronized',
      error: { source: 'balance_fetch', description: error }
    };
  }

  try {
    const balance = await api?.query.system.account(addressString);
    const freeBalance =
      balance && 'data' in balance && 'free' in (balance as any).data
        ? parseFloat((balance.data as any).free.toString())
        : undefined;

    // TODO: Delete mock balance when there are accounts with tokens
    if (errorAddresses.includes(addressString)) {
      throw new Error('Address in error list');
    }
    const mockBalance = mockBalances.find(
      (balance) => balance.address === addressString
    )?.balance;

    return {
      ...address,
      balance: mockBalance ?? freeBalance,
      status: 'synchronized',
      error: undefined
    };
  } catch (e) {
    console.error('Error getting balance:', e);
    return {
      ...address,
      balance: undefined,
      status: 'synchronized',
      error: {
        source: 'balance_fetch',
        description: errorDetails.balance_not_gotten.description ?? ''
      }
    };
  } finally {
    if (api) {
      await api.disconnect();
    } else if (provider) {
      await provider.disconnect();
    }
  }
}

/**
 * Updates the transaction status with optional details.
 */
export interface UpdateTransactionStatus {
  (
    status: TransactionStatus,
    message?: string,
    txDetails?: { txHash?: string; blockHash?: string; blockNumber?: string }
  ): void;
}

// Prepare Transaction
async function prepareTransaction(
  api: ApiPromise,
  senderAddress: string,
  receiverAddress: string,
  appConfig: AppConfig
) {
  const nonceResp = await api.query.system.account(senderAddress);
  const { nonce } = nonceResp.toHuman() as any;

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
  const transfer = api.tx.balances.transferKeepAlive(
    receiverAddress,
    MINIMUM_AMOUNT
  ); // TODO: Replace MINIMUM_AMOUNT by amount

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

  return { transfer, payload, metadataHash, merkleizedMetadata, nonce };
}

interface SignTransactionMetadata extends MetadataMerkleizer {
  chainId: string;
}

// Sign Transaction
async function signTransaction(
  genericApp: PolkadotGenericApp,
  bip44Path: string,
  payloadBytes: Uint8Array,
  metadata: SignTransactionMetadata
) {
  genericApp.txMetadataChainId = metadata.chainId;
  const proof1: Uint8Array = metadata.getProofForExtrinsicPayload(payloadBytes);
  const { signature } = await genericApp.signWithMetadata(
    bip44Path,
    Buffer.from(payloadBytes),
    Buffer.from(proof1)
  );
  return signature;
}

// Create Signed Extrinsic
function createSignedExtrinsic(
  api: ApiPromise,
  transfer: SubmittableExtrinsic<'promise', ISubmittableResult>,
  senderAddress: string,
  signature: Uint8Array,
  payload: GenericExtrinsicPayload,
  nonce: number,
  metadataHash: Uint8Array
) {
  const payloadValue: ExtrinsicPayloadValue = {
    era: payload.era,
    genesisHash: api.genesisHash,
    blockHash: api.genesisHash,
    method: transfer.method.toHex(),
    nonce,
    specVersion: api.runtimeVersion.specVersion,
    tip: 0,
    transactionVersion: api.runtimeVersion.transactionVersion,
    mode: 1,
    metadataHash: hexToU8a('01' + Buffer.from(metadataHash).toString('hex'))
  };

  return transfer.addSignature(senderAddress, signature, payloadValue);
}

// Submit Transaction and Handle Status
async function submitAndHandleTransaction(
  transfer: SubmittableExtrinsic<'promise', ISubmittableResult>,
  updateStatus: UpdateTransactionStatus,
  api: ApiPromise
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      updateStatus(
        'unknown',
        'Transaction timed out, check the transaction status in the explorer.'
      );
      reject(new Error('Transaction timed out'));
    }, 120000); // 2-minute timeout

    transfer
      .send(async (status: ISubmittableResult) => {
        let blockNumber: string | undefined;
        let blockHash: string | undefined;
        let txHash: string | undefined;

        if (status.isInBlock) {
          blockHash = status.status.asInBlock.toHex();
          txHash = status.txHash.toHex();
          blockNumber =
            'blockNumber' in status
              ? (status.blockNumber as Hash)?.toHex()
              : undefined;
          updateStatus('inBlock', `In block: ${blockHash}`, {
            txHash,
            blockHash,
            blockNumber
          });
        }
        if (status.isFinalized) {
          clearTimeout(timeoutId);
          blockHash = status.status.asFinalized.toHex();
          txHash = status.txHash.toHex();
          blockNumber =
            'blockNumber' in status
              ? (status.blockNumber as Hash)?.toHex()
              : undefined;

          console.log(`Transaction finalized in block: ${blockHash}`);
          updateStatus('finalized', `Finalized in block: ${blockHash}`, {
            txHash,
            blockHash,
            blockNumber
          });

          if (!status.txIndex) {
            updateStatus('unknown', 'The status is unknown', {
              txHash,
              blockHash,
              blockNumber
            });
            resolve();
            return; // Resolve here, as we have a final status
          }

          const result = await getTransactionDetails(
            api,
            blockHash,
            status.txIndex
          );
          if (result?.success) {
            console.log(
              `Transaction successful: ${txHash}, ${blockHash}, ${blockNumber}`
            );
            updateStatus('success', 'Successful Transaction', {
              txHash,
              blockHash,
              blockNumber
            });
            resolve();
          } else if (result?.error) {
            updateStatus('failed', result.error, {
              txHash,
              blockHash,
              blockNumber
            });
            reject(new Error(result.error)); // Reject with the specific error
          } else {
            // Handle cases where result is undefined or doesn't have success/error
            updateStatus('error', 'Unknown transaction status', {
              txHash,
              blockHash,
              blockNumber
            });
            reject(new Error('Unknown transaction status'));
          }
        } else if (status.isError) {
          clearTimeout(timeoutId);
          console.error('Transaction is error ', status.dispatchError);
          updateStatus('error', 'Transaction is error');
          reject(new Error('Transaction is error'));
        } else if (status.isWarning) {
          console.log('Transaction is warning');
          updateStatus('warning', 'Transaction is warning');
        } else if (status.isCompleted) {
          console.log('Transaction is completed');
          updateStatus('completed', 'Transaction is completed');
        }
      })
      .catch((error: any) => {
        clearTimeout(timeoutId);
        console.error('Error sending transaction:', error);
        updateStatus('error', 'Error sending transaction');
        reject(error);
      });
  });
}

// Main createTransfer function (simplified)
export const createTransfer = async (
  genericApp: PolkadotGenericApp,
  senderAddress: string,
  receiverAddress: string,
  amount: number,
  appConfig: AppConfig,
  index: number,
  updateStatus: UpdateTransactionStatus
) => {
  const { api, error } = await getApiAndProvider(appConfig.rpcEndpoint);
  if (error || !api) {
    // updateStatus('error', error); // Report connection error
    throw new Error(error ?? 'Failed to connect to the blockchain.');
  }

  try {
    const preparedTx = await prepareTransaction(
      api,
      senderAddress,
      receiverAddress,
      appConfig
    );
    if (!preparedTx) {
      throw new Error('Prepare transaction failed');
    }
    const { transfer, payload, metadataHash, merkleizedMetadata, nonce } =
      preparedTx;

    const bip44Path = getBip44Path(appConfig.bip44Path, index);
    const signature = await signTransaction(
      genericApp,
      bip44Path,
      payload.toU8a(true),
      { ...merkleizedMetadata, chainId: appConfig.ticker.toLowerCase() }
    );

    const signedExtrinsic = createSignedExtrinsic(
      api,
      transfer,
      senderAddress,
      signature,
      payload,
      nonce,
      metadataHash
    );

    await submitAndHandleTransaction(transfer, updateStatus, api);
  } finally {
    await api.disconnect();
  }
};

export const getBip44Path = (bip44Path: string, index: number) =>
  bip44Path.replace(/\/0'$/, `/${index}'`);

// Get Transaction Details
export async function getTransactionDetails(
  api: ApiPromise,
  blockHash: string,
  txIndex: number
): Promise<{ success: boolean; error?: string } | undefined> {
  // Use api.at(blockHash) to get the API for that block
  const apiAt = await api.at(blockHash);
  // Get the events and filter the ones related to this extrinsic.
  const records = await apiAt.query.system.events();

  // Find events related to the specific extrinsic
  const relatedEvents = (records as any).filter(
    ({
      phase
    }: {
      phase: {
        isApplyExtrinsic: any;
        asApplyExtrinsic: { eq: (arg0: any) => any };
      };
    }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(txIndex)
  );

  let success = false;
  let errorInfo: string | undefined;

  relatedEvents.forEach(({ event }: { event: any }) => {
    if (apiAt.events.system.ExtrinsicSuccess.is(event)) {
      success = true;
    } else if (apiAt.events.system.ExtrinsicFailed.is(event)) {
      console.log('Transaction failed!');
      const [dispatchError] = event.data;

      if ((dispatchError as any).isModule) {
        // for module errors, we have the section indexed, lookup
        const decoded = apiAt.registry.findMetaError(
          (dispatchError as any).asModule
        );
        errorInfo = `${decoded.section}.${decoded.name}: ${decoded.docs.join(
          ' '
        )}`;
      } else {
        // Other, CannotLookup, BadOrigin, no extra info
        errorInfo = dispatchError.toString();
      }
    }
  });

  if (success) {
    console.log('Transaction successful!');
    return { success: true };
  } else if (errorInfo) {
    return {
      success: false,
      error: `Transaction failed on-chain: ${errorInfo}`
    };
  }
  // Important:  Handle the case where neither success nor failure is found.
  return undefined;
}
