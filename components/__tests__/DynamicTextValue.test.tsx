import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DynamicTextValue from '../DynamicTextValue'

describe('DynamicTextValue Component', () => {
  it('renders the provided value correctly', () => {
    render(<DynamicTextValue value="Test Value" />)
    const element = screen.getByText('Test Value')
    expect(element).toBeDefined()
  })

  it('applies formatting when formatter function is provided', () => {
    const formatter = vi.fn((value) => `Formatted: ${value}`)
    render(<DynamicTextValue value="Test Value" formatter={formatter} />)
    
    expect(formatter).toHaveBeenCalledWith('Test Value')
    expect(screen.getByText('Formatted: Test Value')).toBeDefined()
  })

  it('handles numeric values correctly', () => {
    render(<DynamicTextValue value={42} />)
    expect(screen.getByText('42')).toBeDefined()
  })

  it('renders a dash when value is undefined', () => {
    render(<DynamicTextValue value={undefined} />)
    expect(screen.getByText('-')).toBeDefined()
  })

  it('renders a custom placeholder when provided', () => {
    render(<DynamicTextValue value={undefined} placeholder="N/A" />)
    expect(screen.getByText('N/A')).toBeDefined()
  })

  it('applies the provided className', () => {
    render(<DynamicTextValue value="Test" className="custom-class" />)
    const element = screen.getByText('Test')
    expect(element.className).toContain('custom-class')
  })
  
  it('applies custom styling when provided', () => {
    render(<DynamicTextValue value="Test" style={{ color: 'red' }} />)
    const element = screen.getByText('Test')
    expect(element.style.color).toBe('red')
  })
  
  it('handles boolean values correctly', () => {
    render(<DynamicTextValue value={true} />)
    expect(screen.getByText('true')).toBeDefined()
    
    render(<DynamicTextValue value={false} />)
    expect(screen.getByText('false')).toBeDefined()
  })
  
  it('handles object values by stringifying them', () => {
    const obj = { key: 'value' }
    render(<DynamicTextValue value={obj} />)
    expect(screen.getByText(JSON.stringify(obj))).toBeDefined()
  })
})
