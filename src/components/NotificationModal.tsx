import React, { useEffect, useState } from 'react';
import {
  registerToastListener,
  registerConfirmListener,
  registerLoadingListener,
  ToastItem,
  ConfirmDialogOptions
} from '../lib/alerts';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Loader2, X } from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [loadingState, setLoadingState] = useState<{ open: boolean; title: string }>({
    open: false,
    title: ''
  });

  useEffect(() => {
    const unsubToast = registerToastListener(setToasts);
    const unsubConfirm = registerConfirmListener(setConfirmDialog);
    const unsubLoading = registerLoadingListener(setLoadingState);
    return () => {
      unsubToast();
      unsubConfirm();
      unsubLoading();
    };
  }, []);

  return (
    <>
      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-in text-sm ${
              t.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : t.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : t.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : 'bg-blue-50/95 border-blue-200 text-blue-900'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 font-medium leading-snug">{t.message}</div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 animate-scale-up">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                  confirmDialog.type === 'danger' || confirmDialog.type === 'warning'
                    ? 'bg-rose-50 text-rose-600'
                    : confirmDialog.type === 'question'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {confirmDialog.type === 'danger' || confirmDialog.type === 'warning' ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : confirmDialog.type === 'question' ? (
                  <Info className="w-8 h-8" />
                ) : (
                  <AlertCircle className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
              {confirmDialog.message && (
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {confirmDialog.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => confirmDialog.onCancel?.()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm cursor-pointer"
              >
                {confirmDialog.cancelText || 'ยกเลิก'}
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-colors text-sm cursor-pointer shadow-sm ${
                  confirmDialog.type === 'danger' || confirmDialog.type === 'warning'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmText || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {loadingState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 max-w-xs w-full border border-slate-100">
            <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
            <div className="text-sm font-semibold text-slate-800 text-center">
              {loadingState.title || 'กำลังประมวลผล...'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
