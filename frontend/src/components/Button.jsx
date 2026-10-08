/**
 * Button — design-system button.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
 * size:    'sm' | 'md' | 'lg' | 'icon'
 * loading: boolean — shows a spinner, disables interaction
 * as:      render as <a> or other element (passes href etc.)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  as: Tag = 'button',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true" style={{
          width: '1em', height: '1em',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {children}
    </Tag>
  );
}
