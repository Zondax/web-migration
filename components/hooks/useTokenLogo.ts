import { uiState$ } from 'state/ui'

/**
 * useTokenLogo
 *
 * Returns the icon object for a given token.
 *
 * @param token - The token object containing a logoId
 * @returns The icon object or undefined if not found
 */
export function useTokenLogo(tokenLogoId: string | undefined): string | undefined {
  if (!tokenLogoId) return undefined
  return uiState$.icons.get()[tokenLogoId]
}
