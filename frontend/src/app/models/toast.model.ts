export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // milliseconds, default 5000
  action?: {
    label: string;
    callback: () => void;
  };
}
