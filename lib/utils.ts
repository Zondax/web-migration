import { ResponseVersion } from '@zondax/ledger-js';
import {
  decodeLedgerResponseCode,
  errorDetails,
  InternalErrors,
  LedgerErrorDetails,
  LedgerErrors
} from 'app/config/errors';
import { notifications$ } from 'app/state/notifications';
import { ledgerWalletState$ } from 'app/state/wallet/ledger';
import axios from 'axios';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleWalletError(
  error: unknown,
  defaultError: InternalErrors | LedgerErrors
): LedgerErrorDetails {
  let resolvedError: LedgerErrorDetails | undefined;

  if (error instanceof Error) {
    const errorDetail = errorDetails[error.name as keyof typeof errorDetails];
    if (errorDetail) {
      resolvedError = errorDetail;
    } else if ('returnCode' in error) {
      resolvedError = decodeLedgerResponseCode(error.returnCode as number);
    }
  }

  if (!resolvedError) {
    resolvedError = errorDetails[defaultError] || errorDetails.default;
  }

  // Update wallet state
  ledgerWalletState$.deviceConnection.error.set(resolvedError);
  ledgerWalletState$.deviceConnection.isLoading.set(false);

  notifications$.push({
    title: resolvedError.title,
    description: resolvedError.description ?? '',
    type: 'error',
    autoHideDuration: 5000
  });

  return resolvedError;
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

/**
 * Formats a balance to a human-readable string.
 *
 * @param {number} balance - The balance to format.
 * @returns {string} The formatted balance.
 */
export const formatBalance = (
  balance: number,
  ticker: string,
  decimals?: number
): string => {
  if (balance === 0) {
    return `0 ${ticker}`;
  }

  const adjustedBalance = decimals ? balance / Math.pow(10, decimals) : balance;

  const formattedBalance = adjustedBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5
  });

  return `${formattedBalance} ${ticker}`;
};

export const formatVersion = (version: ResponseVersion): string => {
  const { major, minor, patch } = version;
  return `${major}.${minor}.${patch}`;
};

export const getAppLightIcon = async (appId: string) => {
  try {
    const hubUrl = process.env.NEXT_PUBLIC_HUB_BACKEND_URL;

    if (!hubUrl) {
      return;
    }

    const response = await axios.get(hubUrl + `/app/${appId}/icon/light`);
    return { data: response.data, error: undefined };
  } catch (error) {
    // TODO: capture exception
    return { data: [], error: 'error' };
  }
};
