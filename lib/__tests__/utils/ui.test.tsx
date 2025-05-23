import { TransactionStatus } from 'state/types/ledger'
import { describe, expect, it, vi } from 'vitest'

import { getTransactionStatus, isValidNumberInput } from '../../utils/ui'

// Mock lucide-react icons and Spinner
vi.mock('lucide-react', () => ({
  AlertCircle: (props: any) => <div data-testid="alert-circle" {...props} />,
  CheckCircle: (props: any) => <div data-testid="check-circle" {...props} />,
  Clock: (props: any) => <div data-testid="clock" {...props} />,
  XCircle: (props: any) => <div data-testid="x-circle" {...props} />,
}))
vi.mock('@/components/icons', () => ({
  Spinner: () => <div data-testid="spinner" />,
}))

describe('getTransactionStatus', () => {
  it('returns Spinner and message for IS_LOADING', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.IS_LOADING)
    expect(statusMessage).toBe('Loading...')
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns Clock and message for PENDING', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.PENDING)
    expect(statusMessage).toBe('Transaction pending...')
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns Clock for IN_BLOCK', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.IN_BLOCK)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns Clock for FINALIZED', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.FINALIZED)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns CheckCircle for SUCCESS', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.SUCCESS)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns XCircle for FAILED', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.FAILED)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns AlertCircle for ERROR', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.ERROR)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns AlertCircle for WARNING', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.WARNING)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns Clock for COMPLETED', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(TransactionStatus.COMPLETED)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns default for undefined status', () => {
    const { statusIcon, statusMessage } = getTransactionStatus(undefined)
    expect(statusMessage).toBeUndefined()
    expect(statusIcon).toMatchSnapshot()
  })
  it('returns custom message if provided', () => {
    const { statusMessage } = getTransactionStatus(TransactionStatus.SUCCESS, 'Custom!')
    expect(statusMessage).toBe('Custom!')
  })
  it('applies correct icon size', () => {
    const { statusIcon } = getTransactionStatus(TransactionStatus.SUCCESS, undefined, 'lg')
    expect(statusIcon).toMatchSnapshot()
  })
})

describe('isValidNumberInput', () => {
  it('returns true for valid numbers', () => {
    expect(isValidNumberInput('123')).toBe(true)
    expect(isValidNumberInput('123.45')).toBe(true)
    expect(isValidNumberInput('0')).toBe(true)
    expect(isValidNumberInput('')).toBe(true)
    expect(isValidNumberInput('.5')).toBe(true)
  })
  it('returns false for invalid numbers', () => {
    expect(isValidNumberInput('abc')).toBe(false)
    expect(isValidNumberInput('12.34.56')).toBe(false)
    expect(isValidNumberInput('1a2')).toBe(false)
    expect(isValidNumberInput('..')).toBe(false)
    expect(isValidNumberInput('1.2.3')).toBe(false)
  })
})
