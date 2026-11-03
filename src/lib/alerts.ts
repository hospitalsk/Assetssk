// Modern SweetAlert2-inspired Alert & Modal utility
type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'question' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

let toastListeners: Array<(toasts: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];

let confirmModalListener: ((dialog: ConfirmDialogOptions | null) => void) | null = null;
let loadingModalListener: ((loadingState: { open: boolean; title: string }) => void) | null = null;

export const registerToastListener = (fn: (toasts: ToastItem[]) => void) => {
  toastListeners.push(fn);
  return () => {
    toastListeners = toastListeners.filter(l => l !== fn);
  };
};

export const registerConfirmListener = (fn: (dialog: ConfirmDialogOptions | null) => void) => {
  confirmModalListener = fn;
  return () => {
    confirmModalListener = null;
  };
};

export const registerLoadingListener = (fn: (loadingState: { open: boolean; title: string }) => void) => {
  loadingModalListener = fn;
  return () => {
    loadingModalListener = null;
  };
};

export function showToast(message: string, type: ToastType = 'success') {
  const item: ToastItem = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };
  toasts = [...toasts, item];
  toastListeners.forEach(fn => fn(toasts));

  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== item.id);
    toastListeners.forEach(fn => fn(toasts));
  }, 3500);
}

export function showConfirm(
  title: string,
  message: string = '',
  confirmText: string = 'ยืนยัน',
  cancelText: string = 'ยกเลิก',
  type: 'warning' | 'danger' | 'question' | 'info' = 'warning'
): Promise<boolean> {
  return new Promise(resolve => {
    if (confirmModalListener) {
      confirmModalListener({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          if (confirmModalListener) confirmModalListener(null);
          resolve(true);
        },
        onCancel: () => {
          if (confirmModalListener) confirmModalListener(null);
          resolve(false);
        },
      });
    } else {
      resolve(window.confirm(`${title}\n${message}`));
    }
  });
}

export function showLoading(title: string = 'กำลังประมวลผล...') {
  if (loadingModalListener) {
    loadingModalListener({ open: true, title });
  }
}

export function hideLoading() {
  if (loadingModalListener) {
    loadingModalListener({ open: false, title: '' });
  }
}
