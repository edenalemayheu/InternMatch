/**
 * EmptyState — centered placeholder for empty lists/views.
 *
 * Props:
 *   icon     — emoji or SVG element
 *   title    — string
 *   message  — string
 *   action   — ReactNode (e.g. a <Button />)
 */
export default function EmptyState({ icon = null, title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-16) var(--space-6)',
      gap: 'var(--space-4)',
    }}>
      {icon && <span style={{ fontSize: '3rem', lineHeight: 1 }} aria-hidden="true">{icon}</span>}
      {!icon && (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      )}
      {title && (
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-ink)',
          margin: 0,
        }}>
          {title}
        </h3>
      )}
      {message && (
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-ink-2)',
          maxWidth: '380px',
          margin: 0,
          lineHeight: 'var(--leading-normal)',
        }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--space-2)' }}>{action}</div>}
    </div>
  );
}
