import { errorDetails, LedgerErrorParams } from 'app/config/errors';
import { ledgerWalletState$ } from 'app/state/wallet/ledger';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleError(
  e: any,
  defaultError: LedgerErrorParams
): LedgerErrorParams {
  let error: LedgerErrorParams;
  if (e instanceof Error) {
    if (e.name in errorDetails) {
      error = errorDetails[e.name as keyof typeof errorDetails];
    } else {
      error = defaultError;
    }
  } else {
    error = errorDetails.default;
  }
  ledgerWalletState$.error.set(error);
  ledgerWalletState$.isLoading.set(false);
  console.error(`${error.title} - ${error.content}`);

  return error;
}
