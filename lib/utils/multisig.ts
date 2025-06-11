import type { AppId } from '@/config/apps'
import { ledgerClient } from '@/state/client/ledger'

export interface CallDataValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates call data against a call hash
 * @param appId - The application ID
 * @param callDataValue - The call data to validate
 * @param callHashValue - The call hash to validate against
 * @returns Promise<CallDataValidationResult> - Validation result with status and error message
 */
export async function validateCallData(appId: AppId, callDataValue: string, callHashValue: string): Promise<CallDataValidationResult> {
  // Return early if missing required values
  if (!callDataValue || !callHashValue) {
    return { isValid: true } // Consider empty values as valid (no validation needed)
  }

  // Basic format validation first
  if (!callDataValue.startsWith('0x') || !/^0x[a-fA-F0-9]+$/.test(callDataValue)) {
    return {
      isValid: false,
      error: 'Invalid hex format',
    }
  }

  try {
    // Validate call data against call hash
    const isValid = await ledgerClient.validateCallDataMatchesHash(appId, callDataValue, callHashValue)

    if (!isValid) {
      return {
        isValid: false,
        error: 'Call data does not match the expected call hash',
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate call data',
    }
  }
}
