import Transport from '@ledgerhq/hw-transport';

/**
 * Represents a response object from a connection request.
 */
export interface ConnectionResponse {
  error?: string;
  connected?: boolean;
}

/**
 * Represents the properties of a device connection.
 */
export interface DeviceConnectionProps {
  transport?: Transport;
}
