import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddressLink } from '../AddressLink';

describe('AddressLink Component', () => {
  it('renders correctly with an address', () => {
    render(<AddressLink value="f1234567890abcdef" />);
    
    // Check if the link is in the document
    const addressElement = screen.getByText(/f1.*def/);
    expect(addressElement).toBeDefined();
  });

  it('renders with correct href attribute when url is provided', () => {
    render(<AddressLink value="f1234567890abcdef" url="https://example.com/f1234567890abcdef" />);
    
    // Check if the link points to the correct URL
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://example.com/f1234567890abcdef');
  });

  it('applies custom className when provided', () => {
    render(<AddressLink value="f1234567890abcdef" url="https://example.com" className="custom-class" />);
    
    const link = screen.getByRole('link');
    expect(link.className).toContain('custom-class');
  });
  
  it('displays a shortened version of the address', () => {
    render(<AddressLink value="f1234567890abcdef" />);
    
    // Check for truncated version of the address
    const displayedText = screen.getByText(/f1.*def/).textContent;
    expect(displayedText?.length).toBeLessThan('f1234567890abcdef'.length);
    expect(displayedText).toContain('...');
  });
  
  it('has a copy button by default', () => {
    render(<AddressLink value="f1234567890abcdef" />);
    
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeDefined();
  });
  
  it('does not render copy button when hasCopyButton is false', () => {
    render(<AddressLink value="f1234567890abcdef" hasCopyButton={false} />);
    
    const copyButtons = screen.queryAllByRole('button');
    expect(copyButtons.length).toBe(0);
  });
});
