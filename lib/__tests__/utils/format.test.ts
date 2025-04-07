import { describe, expect, it } from 'vitest'

import { formatBalance, formatVersion, truncateMiddleOfString } from '../../utils/format'

describe('truncateMiddleOfString', () => {
  it('should return null for empty string', () => {
    expect(truncateMiddleOfString('', 10)).toBeNull()
  })

  it('should return the original string if it is shorter than maxLength', () => {
    expect(truncateMiddleOfString('short', 10)).toBe('short')
  })

  it('should truncate the middle of a long string', () => {
    expect(truncateMiddleOfString('1234567890', 6)).toBe('123...890')
  })

  it('should handle odd maxLength', () => {
    expect(truncateMiddleOfString('1234567890', 5)).toBe('12...90')
  })
})

describe('formatBalance', () => {
  it('should format zero balance', () => {
    expect(formatBalance(0, 'DOT')).toBe('0 DOT')
  })

  it('should format balance without decimals', () => {
    expect(formatBalance(1000, 'DOT')).toBe('1,000 DOT')
  })

  it('should format balance with decimals', () => {
    expect(formatBalance(123456789, 'DOT', 8)).toBe('1.23457 DOT')
  })

  it('should handle large numbers', () => {
    expect(formatBalance(1000000000, 'DOT')).toBe('1,000,000,000 DOT')
  })
})

describe('formatVersion', () => {
  it('should format major, minor, and patch version correctly', () => {
    expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3')
  })

  it('should handle zero values correctly', () => {
    expect(formatVersion({ major: 0, minor: 0, patch: 0 })).toBe('0.0.0')
  })

  it('should handle single-digit version numbers', () => {
    expect(formatVersion({ major: 1, minor: 0, patch: 0 })).toBe('1.0.0')
  })

  it('should handle double-digit version numbers', () => {
    expect(formatVersion({ major: 10, minor: 11, patch: 12 })).toBe('10.11.12')
  })

  it('should work with mixtures of single and double digit version numbers', () => {
    expect(formatVersion({ major: 2, minor: 10, patch: 3 })).toBe('2.10.3')
  })
})
