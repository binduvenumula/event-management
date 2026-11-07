import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Generic modal: closes on backdrop click and Escape. `footer` is rendered in a bar under the content.
export default function Modal({ title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];
  // Rendered in a portal so transformed / overflow-hidden parents (e.g. event cards) cannot clip it.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`flex max-h-[92vh] w-full ${width} flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}
        role="dialog" aria-modal="true" aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// Confirmation dialog for destructive / important actions.
export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onClose }) {
  return (
    <Modal
      title={title} onClose={onClose} size="sm"
      footer={
        <>
          <button className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
