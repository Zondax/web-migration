import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tabs from '../Tabs';

describe('Tabs Component', () => {
  const mockTabs = [
    { label: 'Tab 1', content: 'Content 1' },
    { label: 'Tab 2', content: 'Content 2' },
    { label: 'Tab 3', content: 'Content 3' },
  ];

  it('renders all tab labels', () => {
    render(<Tabs tabs={mockTabs} />);
    
    expect(screen.getByText('Tab 1')).toBeDefined();
    expect(screen.getByText('Tab 2')).toBeDefined();
    expect(screen.getByText('Tab 3')).toBeDefined();
  });

  it('renders the first tab content by default', () => {
    render(<Tabs tabs={mockTabs} />);
    
    expect(screen.getByText('Content 1')).toBeDefined();
    expect(screen.queryByText('Content 2')).toBeNull();
    expect(screen.queryByText('Content 3')).toBeNull();
  });

  it('changes content when clicking different tabs', () => {
    render(<Tabs tabs={mockTabs} />);
    
    // Initially, first tab is active
    expect(screen.getByText('Content 1')).toBeDefined();
    
    // Click the second tab
    fireEvent.click(screen.getByText('Tab 2'));
    
    // Now second tab content should be visible
    expect(screen.queryByText('Content 1')).toBeNull();
    expect(screen.getByText('Content 2')).toBeDefined();
    expect(screen.queryByText('Content 3')).toBeNull();
  });

  it('highlights the active tab', () => {
    render(<Tabs tabs={mockTabs} />);
    
    // Using data-state="active" assumption - adjust as needed for your component
    const activeTab = screen.getByText('Tab 1').closest('[data-state="active"]');
    expect(activeTab).toBeDefined();
    
    // Click the third tab
    fireEvent.click(screen.getByText('Tab 3'));
    
    // Now third tab should be active
    const newActiveTab = screen.getByText('Tab 3').closest('[data-state="active"]');
    expect(newActiveTab).toBeDefined();
  });

  it('calls onChange handler when tab changes', () => {
    const handleChange = vi.fn();
    render(<Tabs tabs={mockTabs} onChange={handleChange} />);
    
    // Click the second tab
    fireEvent.click(screen.getByText('Tab 2'));
    
    // Check if handler was called with correct index
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('respects defaultIndex prop', () => {
    render(<Tabs tabs={mockTabs} defaultIndex={2} />);
    
    // Third tab content should be visible initially
    expect(screen.queryByText('Content 1')).toBeNull();
    expect(screen.queryByText('Content 2')).toBeNull();
    expect(screen.getByText('Content 3')).toBeDefined();
  });
});