import {
  createSignedExtrinsic,
  getApiAndProvider,
  prepareTransaction,
  submitAndHandleTransaction
} from '@/lib/account';
import { getBip44Path, ledgerService } from '@/lib/ledger/ledgerService';
import { formatVersion } from '@/lib/utils';
import Transport from '@ledgerhq/hw-transport';
import { PolkadotGenericApp } from '@zondax/ledger-substrate';
import { GenericeResponseAddress } from '@zondax/ledger-substrate/dist/common';
import { AppConfig, AppIds, appsConfigs } from 'app/config/apps';
import { maxAddressesToFetch } from 'app/config/config';
import { InternalErrors } from 'app/config/errors';
import { errorApps } from 'app/config/mockData';
import {
  Address,
  ConnectionResponse,
  DeviceConnectionProps,
  TransactionStatus,
  UpdateMigratedStatusFn
} from '../types/ledger';
import { withErrorHandling } from './base';

export const ledgerClient = {
  // Device operations
  async openPolkadotMigrationApp(transport: Transport) {
    return withErrorHandling(
      () => ledgerService.openApp(transport, 'Polkadot Migration'),
      InternalErrors.APP_NOT_OPEN
    );
  },

  async initializeTransport(): Promise<Transport> {
    return withErrorHandling(
      () => ledgerService.initializeTransport(),
      InternalErrors.CONNECTION_ERROR
    );
  },

  async getAppVersion(
    genericApp: PolkadotGenericApp
  ): Promise<string | undefined> {
    return withErrorHandling(async () => {
      const version = await ledgerService.getAppVersion(genericApp);
      return version ? formatVersion(version) : undefined;
    }, InternalErrors.UNKNOWN_ERROR);
  },

  async establishDeviceConnection(): Promise<
    DeviceConnectionProps | undefined
  > {
    return withErrorHandling(
      () => ledgerService.establishDeviceConnection(),
      InternalErrors.CONNECTION_ERROR
    );
  },

  async connectDevice(): Promise<ConnectionResponse | undefined> {
    return withErrorHandling(
      () => ledgerService.connectDevice(),
      InternalErrors.CONNECTION_ERROR
    );
  },

  async getAccountAddress(
    bip44Path: string,
    ss58prefix: number,
    showAddrInDevice: boolean
  ): Promise<GenericeResponseAddress | undefined> {
    return withErrorHandling(
      () =>
        ledgerService.getAccountAddress(
          bip44Path,
          ss58prefix,
          showAddrInDevice
        ),
      InternalErrors.GET_ADDRESS_ERROR
    );
  },

  async synchronizeAccounts(
    app: AppConfig
  ): Promise<{ result?: GenericeResponseAddress[] }> {
    // TODO: Delete mock error handling
    if (errorApps.includes(app.id)) {
      throw new Error(InternalErrors.SYNC_ERROR);
    }
    return withErrorHandling(
      () =>
        ledgerService.synchronizeAccounts(
          app.bip44Path,
          app.ss58Prefix,
          maxAddressesToFetch
        ),
      InternalErrors.SYNC_ERROR
    );
  },

  async migrateAccount(
    appId: AppIds,
    account: Address,
    accountIndex: number,
    updateStatus: UpdateMigratedStatusFn
  ): Promise<{ migrated?: boolean }> {
    const senderAddress = account.address;
    const receiverAddress = account.destinationAddress;
    const transferAmount = account.balance;
    const appConfig = appsConfigs.get(appId);

    if (!receiverAddress) {
      throw InternalErrors.NO_RECEIVER_ADDRESS;
    }
    if (!transferAmount) {
      throw InternalErrors.NO_TRANSFER_AMOUNT;
    }
    if (!appConfig) {
      throw InternalErrors.APP_CONFIG_NOT_FOUND;
    }

    return withErrorHandling(async () => {
      const { api, error } = await getApiAndProvider(appConfig.rpcEndpoint);
      if (error || !api) {
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
        const { transfer, payload, metadataHash, nonce, proof1, payloadBytes } =
          preparedTx;

        const bip44Path = getBip44Path(appConfig.bip44Path, accountIndex);
        const chainId = appConfig.ticker.toLowerCase();

        const { signature } = await ledgerService.signTransaction(
          bip44Path,
          payloadBytes,
          chainId,
          proof1
        );

        if (signature) {
          const signedExtrinsic = createSignedExtrinsic(
            api,
            transfer,
            senderAddress,
            signature,
            payload,
            nonce,
            metadataHash
          );

          const updateMigratedStatus = (
            status: TransactionStatus,
            message?: string,
            txDetails?: {
              txHash?: string;
              blockHash?: string;
              blockNumber?: string;
            }
          ) => {
            updateStatus(
              appConfig.id,
              accountIndex,
              status,
              message,
              txDetails
            );
          };
          await submitAndHandleTransaction(transfer, updateMigratedStatus, api);

          return { migrated: true };
        }
        return { migrated: false };
      } catch (error) {
        console.error('Error migrating account:', error);
        throw error;
      } finally {
        await api.disconnect();
      }
    }, InternalErrors.UNKNOWN_ERROR);
  },

  clearConnection() {
    ledgerService.clearConnection();
  },

  disconnect() {
    ledgerService.disconnect();
  }
};
