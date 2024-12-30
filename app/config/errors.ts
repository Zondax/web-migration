export interface LedgerErrorDetails {
  title: string;
  description?: string;
  content?: string;
}

export enum InternalErrors {
  'ADDRESS_NOT_SELECTED' = 'address_not_selected',
  'APP_NOT_OPEN' = 'app_not_open',
  'WRONG_APP' = 'wrong_app',
  'UNKNOWN_ERROR' = 'unknown_error',
  'LOCKED_DEVICE' = 'locked_device',
  'DEVICE_NOT_SELECTED' = 'device_not_selected',
  'CONNECTION_ERROR' = 'connection_error',
  'DISCONNECTION_ERROR' = 'disconnection_error',
  'DEFAULT' = 'default'
}

export enum LedgerErrors {
  'TransportStatusError' = 'TransportStatusError',
  'LockedDeviceError' = 'LockedDeviceError',
  'TransportOpenUserCancelled' = 'TransportOpenUserCancelled',
  'TransportRaceCondition' = 'TransportRaceCondition',
  'InvalidStateError' = 'InvalidStateError',
  'TransportInterfaceNotAvailable' = 'TransportInterfaceNotAvailable'
}

export type ErrorDetailsMap = {
  [key in InternalErrors | LedgerErrors]: LedgerErrorDetails;
};

export const errorDetails: ErrorDetailsMap = {
  app_not_open: {
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
  wrong_app: {
    title: 'Wrong app.'
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

export const decodeLedgerResponseCode = (
  errorCode: number
): LedgerErrorDetails | undefined => {
  switch (errorCode) {
    case 21781:
      return errorDetails.LockedDeviceError;
    case 28161:
      return errorDetails.app_not_open;
    case 28160:
      return errorDetails.wrong_app;
    default:
      return undefined;
  }
};
