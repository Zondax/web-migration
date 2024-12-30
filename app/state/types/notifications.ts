/**
 * Notification Type Definition
 */
export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  dismissedAt?: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoHideDuration?: number;
}
