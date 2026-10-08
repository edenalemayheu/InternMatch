/** Badge — status or skill badge. */
export default function Badge({ children, variant = 'pending', className = '' }) {
  return <span className={`badge badge--${variant} ${className}`}>{children}</span>;
}
