import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Modal / ConfirmDialog. */
export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? 'modal-box--wide' : ''}`} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          {title && <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-neutral-900)', fontFamily: "'Inter', sans-serif" }}>{title}</h2>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-600)', marginLeft: 'auto' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'destructive', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>{message}</p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className={`btn btn--${confirmVariant}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
