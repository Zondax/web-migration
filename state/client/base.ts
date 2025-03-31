import { InternalErrors, LedgerErrors } from 'config/errors';

export interface LedgerClientError {
  name: InternalErrors | LedgerErrors;
  message: string;
  metadata?: any;
}

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  defaultError: InternalErrors | LedgerErrors = InternalErrors.UNKNOWN_ERROR
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Map the error to a LedgerError
    const ledgerError: LedgerClientError = {
      name:
        error.name in LedgerErrors
          ? (error.name as LedgerErrors)
          : defaultError,
      message: error.message || 'An unexpected error occurred'
    };

    // consider to add sentry logging here
    throw ledgerError;
  }
};
