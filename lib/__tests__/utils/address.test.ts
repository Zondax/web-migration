import { describe, expect, it } from 'vitest'

import { getBip44Path } from '../../utils/address'

describe('getBip44Path', () => {
  it('should replace last index in basic BIP44 path', () => {
    expect(getBip44Path("m/44'/354'/0'/0'", 1)).toBe("m/44'/354'/0'/1'")
  })

  it('should handle single-digit indices', () => {
    expect(getBip44Path("m/44'/354'/0'/0'", 5)).toBe("m/44'/354'/0'/5'")
  })

  it('should handle double-digit indices', () => {
    expect(getBip44Path("m/44'/354'/0'/0'", 10)).toBe("m/44'/354'/0'/10'")
  })

  it('should handle zero index', () => {
    expect(getBip44Path("m/44'/354'/0'/0'", 0)).toBe("m/44'/354'/0'/0'")
  })

  it('should work with different account paths', () => {
    expect(getBip44Path("m/44'/60'/0'/0'", 3)).toBe("m/44'/60'/0'/3'")
  })

  it('should handle paths with hardened indices', () => {
    expect(getBip44Path("m/44'/0'/0'/0'", 2)).toBe("m/44'/0'/0'/2'")
  })

  it('should handle more complex paths', () => {
    expect(getBip44Path("m/44'/354'/2'/0'", 7)).toBe("m/44'/354'/2'/7'")
  })

  it('should correctly replace only the last index', () => {
    const complexPath = "m/44'/0'/0'/0'/0'"
    expect(getBip44Path(complexPath, 9)).toBe("m/44'/0'/0'/0'/9'")
  })
})
