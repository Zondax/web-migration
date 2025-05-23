import { type ErrorDetails, errorDetails, type InternalErrors, type LedgerErrors } from 'config/errors'
import type { LedgerClientError } from 'state/client/base'

/**
 * Handles a Ledger error by resolving it to a detailed error object.
 *
 * @param error - The error to handle.
 * @param defaultError - The default error to use if the specific error cannot be resolved.
 * @returns The detailed error object.
 */
export function mapLedgerError(error: LedgerClientError, defaultError: InternalErrors | LedgerErrors): ErrorDetails {
  let resolvedError: ErrorDetails | undefined

  const errorDetail = errorDetails[error.name as keyof typeof errorDetails]
  if (errorDetail) {
    resolvedError = errorDetail
  } else {
    resolvedError = errorDetails[defaultError] || errorDetails.default
  }

  return resolvedError
}
