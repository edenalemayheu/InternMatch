/**
 * GlassCard — liquid-glass surface wrapper.
 * Props:
 *   as        — HTML element or component to render (default 'div')
 *   opaque    — boolean; uses 85% opacity variant for data-dense surfaces
 *   radius    — 'default' (32px) | 'sm' (20px)
 *   padding   — CSS string e.g. 'var(--space-6)' (default) or false for none
 *   className — additional classes
 *   hover     — boolean; adds subtle lift on hover
 */
export default function GlassCard({
  as: Tag = 'div',
  opaque = false,
  radius = 'default',
  padding = 'var(--space-6)',
  className = '',
  hover = false,
  style = {},
  children,
  ...props
}) {
  const classes = [
    'glass-card',
    opaque  ? 'glass-card--opaque' : '',
    radius === 'sm' ? 'glass-card--sm' : '',
    hover   ? 'glass-card--hover' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      style={{ padding: padding === false ? undefined : padding, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
