import {
  decodeLedgerResponseCode,
  errorDetails,
  LedgerErrorDetails
} from 'app/config/errors';
import { ledgerWalletState$ } from 'app/state/wallet/ledger';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleWalletError(
  e: any,
  defaultError: LedgerErrorDetails
): LedgerErrorDetails {
  let error: LedgerErrorDetails | undefined;

  if (e instanceof Error) {
    if (e.name in errorDetails) {
      error = errorDetails[e.name as keyof typeof errorDetails];
    }
    if ('returnCode' in e) {
      error = decodeLedgerResponseCode(e.returnCode as number);
    }
  }

  if (!error) {
    error = defaultError ?? errorDetails.default;
  }

  // Update wallet state
  ledgerWalletState$.deviceConnection.error.set(error);
  ledgerWalletState$.deviceConnection.isLoading.set(false);

  // Enhanced error logging
  console.error(
    error.content ? `${error.title} - ${error.content}` : error.title
  );

  return error;
}

/**
 * Copies a string to the clipboard.
 * @param text - The text to copy.
 * @throws Will throw an error if the copy operation fails.
 */
export const copyContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text.toString());
  } catch (err) {
    console.log('Failed to copy content ', err);
    throw err;
  }
};

/**
 * Truncates the middle of a string to a specified maximum length.
 * @param str - The string to truncate.
 * @param maxLength - The maximum length of the string.
 * @returns The truncated string, or undefined if the input string is empty.
 */
export const truncateMiddleOfString = (str: string, maxLength: number) => {
  if (!str) {
    return null;
  }
  if (str.length <= maxLength) {
    return str;
  }
  const middle = Math.floor(maxLength / 2);
  const start = str.substring(0, middle);
  const end = str.substring(str.length - middle, str.length);
  return `${start}...${end}`;
};
