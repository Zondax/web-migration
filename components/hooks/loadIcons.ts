import { useEffect } from 'react';
import { uiState$ } from 'state/ui';

/**
 * A hook that provides functionality for loading application icons
 */
export const useLoadIcons = () => {
  // Load icons on component mount if autoLoad is true
  useEffect(() => {
    uiState$.loadInitialIcons();
  }, []);

  return;
};
