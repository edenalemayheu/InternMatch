/**
 * Blobs.jsx
 * Fixed animated background blobs. Four blobs using the brand palette.
 * variant="animated" (default) — landing page & dashboards
 * variant="slow"     — data-dense pages (tables, admin)
 * variant="static"   — no animation at all
 * prefers-reduced-motion is handled in globals.css (kills all animations).
 */
import styles from './Blobs.module.css';

const BLOBS = [
  { color: 'var(--color-blob-yellow)', top: '-12%',  left: '-8%',   size: 'var(--blob-size-lg)', anim: 'blob-1' },
  { color: 'var(--color-blob-blue)',   top: '20%',   right: '-10%', size: 'var(--blob-size-lg)', anim: 'blob-2' },
  { color: 'var(--color-blob-coral)',  bottom: '5%', left: '15%',   size: 'var(--blob-size-md)', anim: 'blob-3' },
  { color: 'var(--color-blob-violet)', top: '55%',   right: '5%',   size: 'var(--blob-size-sm)', anim: 'blob-4' },
];

const DURATION = { animated: '12s', slow: '30s', static: '0s' };
const ITERATION = { animated: 'infinite', slow: 'infinite', static: '1' };

export default function Blobs({ variant = 'animated' }) {
  const dur = DURATION[variant] ?? DURATION.animated;
  const iter = ITERATION[variant] ?? 'infinite';

  return (
    <div className={styles.blobsRoot} aria-hidden="true">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className={styles.blob}
          style={{
            background: b.color,
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            animationName: variant === 'static' ? 'none' : (variant === 'slow' ? `blob-slow-${(i % 2) + 1}` : b.anim),
            animationDuration: dur,
            animationIterationCount: iter,
          }}
        />
      ))}
    </div>
  );
}
