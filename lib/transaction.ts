import { ApiPromise, WsProvider } from '@polkadot/api';
import { createType } from '@polkadot/types';

// Function to create a transaction blob
async function createTransactionBlob(
  senderAddress: string,
  recipientAddress: string,
  amount: bigint,
  nonce: number
): Promise<Uint8Array> {
  // Connect to a Polkadot node
  const provider = new WsProvider('wss://rpc.polkadot.io');
  const api = await ApiPromise.create({ provider });

  // Construct the transaction
  const transfer = api.tx.balances.transfer(recipientAddress, amount);

  // Create a payload
  const payload = {
    method: transfer.method.toHex(),
    nonce,
    era: 0, // Immortal transaction
    blockHash: api.genesisHash.toHex(),
    genesisHash: api.genesisHash.toHex(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    transactionVersion: api.runtimeVersion.transactionVersion.toNumber()
  };

  // Encode the payload
  const txPayload = createType(api.registry, 'ExtrinsicPayload', payload, {
    version: api.extrinsicVersion
  });

  // Return the encoded payload as a Uint8Array
  return txPayload.toU8a({ method: true });
}
