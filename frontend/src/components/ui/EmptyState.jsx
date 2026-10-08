import { Inbox } from 'lucide-react';

/** EmptyState — centered empty placeholder. */
export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><Icon size={40} /></div>
      {title   && <p className="empty-state__title">{title}</p>}
      {message && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-neutral-600)', maxWidth: 360 }}>{message}</p>}
      {action  && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  );
}
