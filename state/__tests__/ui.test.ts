import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uiState$ } from '../ui';

// Mock the getAppLightIcon function
vi.mock('@/lib/utils', () => ({
  getAppLightIcon: vi.fn().mockResolvedValue({ data: 'mocked-icon-data' }),
}))

describe('UI State', () => {
  beforeEach(() => {
    // Reset the state before each test
    uiState$.icons.set({})
  });

  describe('initial state', () => {
    it('should have empty icons object initially', () => {
      expect(uiState$.icons.get()).toEqual({})
    });
  });

  describe('loadInitialIcons', () => {
    it('should load icons for apps', async () => {
      // Arrange
      const mockGetAppLightIcon = require('@/lib/utils').getAppLightIcon;
      mockGetAppLightIcon.mockResolvedValue({ data: 'test-icon-data' });
      
      // Act
      await uiState$.loadInitialIcons();
      
      // Assert
      expect(mockGetAppLightIcon).toHaveBeenCalled();
      const icons = uiState$.icons.get();
      expect(Object.keys(icons).length).toBeGreaterThan(0);
      
      // Each icon should have the test data
      Object.values(icons).forEach(iconData => {
        expect(iconData).toBe('test-icon-data');
      });
    });
    
    it('should not add icons if there is an error', async () => {
      // Arrange
      const mockGetAppLightIcon = require('@/lib/utils').getAppLightIcon;
      mockGetAppLightIcon.mockResolvedValue({ error: 'Some error' });
      uiState$.icons.set({});
      
      // Act
      await uiState$.loadInitialIcons();
      
      // Assert
      expect(mockGetAppLightIcon).toHaveBeenCalled();
      expect(uiState$.icons.get()).toEqual({});
    });
  });
});