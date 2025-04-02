import { describe, expect, it } from 'vitest'

import { formatBalance, truncateMiddleOfString } from '../utils'

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
