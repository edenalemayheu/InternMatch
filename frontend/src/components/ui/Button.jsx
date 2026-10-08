import { Loader2 } from 'lucide-react';

/**
 * Button — spec-compliant button component.
 * variant: 'primary' | 'secondary' | 'destructive' | 'ghost'
 * size: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', as: Tag = 'button', ...props
}) {
  const cls = `btn btn--${variant} btn--${size} ${loading || disabled ? 'btn--disabled' : ''} ${className}`.trim();
  return (
    <Tag className={cls} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </Tag>
  );
}
