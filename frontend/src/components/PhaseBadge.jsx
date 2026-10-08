/**
 * PhaseBadge — pill showing the current round phase with a color accent.
 * No emoji — all state is conveyed via color and label text.
 *
 * Props:
 *   phase   — phase key string
 *   size    — 'sm' | 'md'
 */

const PHASE_META = {
  ranking_open:     { label: 'Ranking Open',     color: 'var(--color-blob-blue)'   },
  ranking_locked:   { label: 'Ranking Locked',   color: 'var(--color-warning)'     },
  shortlisting:     { label: 'Shortlisting',     color: 'var(--color-blob-coral)'  },
  shortlist_locked: { label: 'Shortlist Locked', color: 'var(--color-blob-coral)'  },
  interviewing:     { label: 'Interviewing',     color: 'var(--color-blob-violet)' },
  company_ranking:  { label: 'Company Ranking',  color: 'var(--color-blob-violet)' },
  company_locked:   { label: 'Rankings Locked',  color: '#A855F7'                  },
  matched:          { label: 'Matched',          color: 'var(--color-accent)'      },
  revealed:         { label: 'Revealed',         color: 'var(--color-blob-yellow)' },
};

export { PHASE_META };

export default function PhaseBadge({ phase, size = 'md' }) {
  const meta = PHASE_META[phase] ?? { label: phase ?? 'Unknown', color: 'var(--color-ink-3)' };

  const styles = {
    sm: { fontSize: 'var(--text-xs)', padding: '2px 10px' },
    md: { fontSize: 'var(--text-sm)', padding: '4px 14px' },
  };

  const s = styles[size] ?? styles.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: s.padding,
        borderRadius: 'var(--radius-full)',
        background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${meta.color} 40%, transparent)`,
        color: meta.color,
        fontSize: s.fontSize,
        fontWeight: 'var(--weight-semibold)',
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  );
}
