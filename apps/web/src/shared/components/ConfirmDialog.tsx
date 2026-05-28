import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Click-away Backdrop overlay */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white border border-slate-100 shadow-xl rounded-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold font-display text-slate-900 mb-2 leading-snug">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/10'
                : 'bg-brand-700 hover:bg-brand-800 shadow-brand-900/10'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ConfirmDialog;
