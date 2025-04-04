import { errorDetails, InternalErrors, LedgerErrorDetails, LedgerErrors } from 'config/errors'
import { LedgerClientError } from 'state/client/base'
import { notifications$ } from 'state/notifications'

/**
 * Handles a Ledger error by resolving it to a detailed error object and showing a notification.
 *
 * @param error - The error to handle.
 * @param defaultError - The default error to use if the specific error cannot be resolved.
 * @returns The detailed error object.
 */
export function handleLedgerError(error: LedgerClientError, defaultError: InternalErrors | LedgerErrors): LedgerErrorDetails {
  let resolvedError: LedgerErrorDetails | undefined

  const errorDetail = errorDetails[error.name as keyof typeof errorDetails]
  if (errorDetail) {
    resolvedError = errorDetail
  } else {
    resolvedError = errorDetails[defaultError] || errorDetails.default
  }

  notifications$.push({
    title: resolvedError.title,
    description: resolvedError.description ?? '',
    type: 'error',
    autoHideDuration: 5000,
  })

  return resolvedError
}
