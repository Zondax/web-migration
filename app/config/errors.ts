export interface LedgerErrorDetails {
  title: string;
  description?: string;
  content?: string;
}

export enum InternalErrors {
  'ADDRESS_NOT_SELECTED' = 'address_not_selected',
  'APP_NOT_OPEN' = 'app_not_open',
  'UNKNOWN_ERROR' = 'unknown_error',
  'LOCKED_DEVICE' = 'locked_device',
  'DEVICE_NOT_SELECTED' = 'device_not_selected',
  'CONNECTION_ERROR' = 'connection_error',
  'DISCONNECTION_ERROR' = 'disconnection_error',
  'BALANCE_NOT_GOTTEN' = 'balance_not_gotten',
  'SYNC_ERROR' = 'sync_error',
  'DEFAULT' = 'default',
  'GET_ADDRESS_ERROR' = 'get_address_error',
  'NO_RECEIVER_ADDRESS' = 'no_receiver_address',
  'NO_TRANSFER_AMOUNT' = 'no_transfer_amount',
  'APP_CONFIG_NOT_FOUND' = 'app_config_not_found',
  'MIGRATION_ERROR' = 'migration_error'
}

export enum LedgerErrors {
  'TransportStatusError' = 'TransportStatusError',
  'LockedDeviceError' = 'LockedDeviceError',
  'TransportOpenUserCancelled' = 'TransportOpenUserCancelled',
  'TransportRaceCondition' = 'TransportRaceCondition',
  'InvalidStateError' = 'InvalidStateError',
  'TransportInterfaceNotAvailable' = 'TransportInterfaceNotAvailable',
  'ClaNotSupported' = 'ClaNotSupported',
  'AppDoesNotSeemToBeOpen' = 'AppDoesNotSeemToBeOpen'
}

export type ErrorDetailsMap = {
  [key in InternalErrors | LedgerErrors]: LedgerErrorDetails;
};

export const errorDetails: ErrorDetailsMap = {
  app_not_open: {
    title: 'App does not seem to be open.',
    description: 'Please open Polkadot Migration App in your device.'
  },
  AppDoesNotSeemToBeOpen: {
    title: 'App does not seem to be open.',
    description: 'Please open Polkadot Migration App in your device.'
  },
  unknown_error: {
    title: 'An unknown error happens, please try again.'
  },
  locked_device: {
    title: 'The device is locked.'
  },
  device_not_selected: {
    title: 'There is no a selected device.'
  },
  connection_error: {
    title: 'Connection Error',
    description:
      'Could not reach Ledger device. Please ensure Ledger device is on and unlocked.'
  },
  disconnection_error: {
    title: 'Disconnection Error',
    description:
      'The Ledger device could not be disconnected. Please ensure the device is properly connected and try again.'
  },
  address_not_selected: {
    title: 'Address not selected',
    description: 'Please select an address to continue.'
  },
  ClaNotSupported: {
    title: 'Wrong app.'
  },
  balance_not_gotten: {
    title: 'Balance Not Retrieved',
    description: 'The balance could not be retrieved. Please try again later.'
  },
  sync_error: {
    title: 'Synchronization Error',
    description:
      'The accounts could not be synchronized. Please try again later.'
  },
  get_address_error: {
    title: 'Get Address Error',
    description: 'Failed to get account address from Ledger device.',
    content: 'Please ensure the device is connected and try again.'
  },
  no_receiver_address: {
    title: 'No Receiver Address',
    description: 'No Polkadot address to migrate to.'
  },
  no_transfer_amount: {
    title: 'No Transfer Amount',
    description: 'There is no amount to transfer.'
  },
  app_config_not_found: {
    title: 'App Configuration Not Found',
    description: 'The app configuration could not be found.'
  },
  migration_error: {
    title: 'Migration Error',
    description: 'Failed to migrate found of an account.',
    content: 'Please try again later or contact support if the issue persists.'
  },
  default: {
    title: 'An unknown error happens, please try again.'
  },
  TransportStatusError: {
    title: 'Transport Status Error',
    description: 'An error occurred with the transport status.',
    content: 'Please check the device connection and try again.'
  },
  LockedDeviceError: {
    title: 'Locked Device Error',
    description: 'The device is locked and cannot be accessed.',
    content: 'Please unlock the device to proceed.'
  },
  TransportOpenUserCancelled: {
    title: 'Transport Open User Cancelled',
    description: 'The user cancelled the transport opening.',
    content: 'Select the device to connect.'
  },
  TransportRaceCondition: {
    title: 'Transport Race Condition',
    description: 'A race condition occurred in the transport.',
    content: 'Please deny from device or reconnect.'
  },
  InvalidStateError: {
    title: 'Invalid State Error',
    description: 'The device is in an invalid state.',
    content: 'Please deny from device or reconnect.'
  },
  TransportInterfaceNotAvailable: {
    title: 'Transport Interface Not Available',
    description: 'The transport interface is not available.',
    content: 'Please disconnect the device and try again.'
  }
};

// export const decodeLedgerResponseCode = (
//   errorCode: number
// ): LedgerErrorDetails | undefined => {
//   switch (errorCode) {
//     case 21781:
//       return errorDetails.LockedDeviceError;
//     case 28161:
//       return errorDetails.app_not_open;
//     default:
//       return undefined;
//   }
// };
