/**
 * Modal — accessible dialog with glass surface.
 *
 * Props:
 *   open      — boolean
 *   onClose   — () => void (called on backdrop click or ESC)
 *   title     — string (shown in header)
 *   size      — 'sm' | 'md' | 'lg' (default 'md')
 *   children
 *
 * Accessibility:
 *   - Renders as role="dialog" aria-modal="true"
 *   - Focus is trapped inside while open
 *   - ESC key closes
 *   - Backdrop click closes
 *   - Body scroll locked while open
 */
import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const SIZES = {
  sm: '400px',
  md: '540px',
  lg: '720px',
};

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, size = 'md', children }) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  /* Lock body scroll */
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Focus first focusable element */
  useEffect(() => {
    if (!open) return;
    const el = dialogRef.current?.querySelector(FOCUSABLE);
    el?.focus();
  }, [open]);

  /* Trap focus */
  const handleKeyDown = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'overlay-in var(--transition-base) both',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(14, 13, 26, 0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: SIZES[size],
          maxHeight: '90dvh',
          overflowY: 'auto',
          background: 'var(--glass-bg-opaque)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--glass-radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modal-in var(--transition-base) both',
        }}
      >
        {/* Header */}
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--space-5) var(--space-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <h2 id="modal-title" style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-ink)',
              margin: 0,
            }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink-3)', fontSize: '1.4rem', lineHeight: 1,
                padding: 'var(--space-1)', borderRadius: 'var(--radius-sm)',
                transition: 'color var(--transition-fast)',
                minHeight: '44px', minWidth: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: 'var(--space-6)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
