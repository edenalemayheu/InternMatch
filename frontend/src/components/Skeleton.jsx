/**
 * Skeleton — animated shimmer placeholder.
 *
 * Props:
 *   width    — CSS string (default '100%')
 *   height   — CSS string (default '1.2em')
 *   radius   — CSS string (default 'var(--radius-md)')
 *   count    — number of rows to render (default 1)
 *   gap      — CSS string between rows (default 'var(--space-3)')
 *
 * Example:
 *   <Skeleton count={3} height="80px" />
 *   <Skeleton width="120px" height="120px" radius="50%" />  ← avatar
 */
export default function Skeleton({
  width = '100%',
  height = '1.2em',
  radius = 'var(--radius-md)',
  count = 1,
  gap = 'var(--space-3)',
}) {
  const shimmerStyle = {
    width,
    height,
    borderRadius: radius,
    background: 'linear-gradient(90deg, var(--color-border-subtle) 0%, var(--color-border) 50%, var(--color-border-subtle) 100%)',
    backgroundSize: '600px 100%',
    animation: 'shimmer 1.6s infinite linear',
    flexShrink: 0,
  };

  if (count === 1) return <div style={shimmerStyle} aria-hidden="true" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={shimmerStyle} />
      ))}
    </div>
  );
}

/* Convenience compound components */
Skeleton.Card = function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <Skeleton width="48px" height="48px" radius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Skeleton width="60%" height="1em" />
          <Skeleton width="40%" height="0.85em" />
        </div>
      </div>
      <Skeleton count={2} height="0.9em" />
    </div>
  );
};

Skeleton.Row = function SkeletonRow() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-3) 0' }}>
      <Skeleton width="36px" height="36px" radius="50%" />
      <Skeleton width="30%" height="1em" />
      <Skeleton width="20%" height="1em" />
      <Skeleton width="15%" height="1em" />
    </div>
  );
};
