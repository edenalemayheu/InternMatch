import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const ICONS = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertCircle,
};

/** Banner — info/success/warning/error bar. */
export default function Banner({ variant = 'info', children, className = '' }) {
  const Icon = ICONS[variant] || Info;
  return (
    <div className={`banner banner--${variant} ${className}`} role="alert">
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}
