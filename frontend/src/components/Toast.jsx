/**
 * Toast / ToastContainer — stacked toast notifications.
 *
 * Place <ToastContainer /> once at the app root (inside App.jsx).
 * It reads from ToastContext — no props needed.
 */
import { createContext, useContext } from 'react';
import { useToast } from '@/hooks/useToast';

/* ── Context ──────────────────────────────────────────────────────────────── */
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const { toasts, toast, dismiss } = useToast();
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToastContext must be inside <ToastProvider>');
  return ctx;
}

/* ── Icons (inline SVG, no extra dep) ────────────────────────────────────── */
const ICONS = {
  success: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>,
  error:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

const COLORS = {
  success: { bg: 'var(--color-accent-light)',  border: 'var(--color-accent)',  text: 'var(--color-accent)' },
  error:   { bg: 'var(--color-danger-light)',  border: 'var(--color-danger)',  text: 'var(--color-danger)' },
  warning: { bg: 'var(--color-warning-light)', border: 'var(--color-warning)', text: 'var(--color-warning)' },
  info:    { bg: 'var(--color-primary-light)', border: 'var(--color-primary)', text: 'var(--color-primary)' },
};

/* ── Container ────────────────────────────────────────────────────────────── */
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        top: 'calc(var(--space-16) + var(--space-4))',  /* below navbar */
        right: 'var(--space-4)',
        zIndex: 'var(--z-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        maxWidth: '360px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const c = COLORS[toast.type] ?? COLORS.info;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--glass-bg-opaque)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        animation: 'fade-in var(--transition-base) both',
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: c.text, fontWeight: 'var(--weight-bold)', flexShrink: 0, marginTop: '1px' }}>
        {ICONS[toast.type]}
      </span>
      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-ink)', lineHeight: 'var(--leading-snug)' }}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-ink-3)', fontSize: '1rem', lineHeight: 1,
          padding: 0, flexShrink: 0, minHeight: '44px', minWidth: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}
