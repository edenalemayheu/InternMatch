/**
 * Pill — skill tag / status badge.
 * variant: 'skill' | 'phase' | 'pending' | 'shortlisted' | 'rejected' | 'matched' | 'neutral'
 * removable: boolean — shows an × button
 * onRemove: () => void
 */
export default function Pill({
  variant = 'skill',
  removable = false,
  onRemove,
  className = '',
  children,
  ...props
}) {
  return (
    <span className={`pill pill--${variant} ${className}`} {...props}>
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${children}`}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 0 0 4px',
            cursor: 'pointer',
            color: 'inherit',
            lineHeight: 1,
            fontSize: '0.9em',
            opacity: 0.7,
            minHeight: 'unset',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
