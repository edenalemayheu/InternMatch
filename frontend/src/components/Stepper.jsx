/**
 * Stepper — horizontal phase progress bar.
 *
 * Props:
 *   currentPhase  — string key of the active phase
 *   compact       — boolean, renders a smaller version for Navbar
 *
 * The 9-phase sequence is defined here; all phase-gating logic lives in the
 * data layer. This component is purely presentational.
 */

const PHASES = [
  { key: 'ranking_open',     label: 'Ranking Open',     short: 'Ranking' },
  { key: 'ranking_locked',   label: 'Ranking Locked',   short: 'Locked' },
  { key: 'shortlisting',     label: 'Shortlisting',     short: 'Shortlist' },
  { key: 'shortlist_locked', label: 'Shortlist Locked', short: 'SL Locked' },
  { key: 'interviewing',     label: 'Interviewing',     short: 'Interview' },
  { key: 'company_ranking',  label: 'Company Ranking',  short: 'Co. Rank' },
  { key: 'company_locked',   label: 'Rankings Locked',  short: 'Co. Locked' },
  { key: 'matched',          label: 'Matched',          short: 'Matched' },
  { key: 'revealed',         label: 'Revealed',         short: 'Revealed' },
];

export { PHASES };

export default function Stepper({ currentPhase, compact = false }) {
  const currentIdx = PHASES.findIndex(p => p.key === currentPhase);

  return (
    <nav
      aria-label="Round phases"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        paddingBottom: compact ? 0 : 'var(--space-1)',
        scrollbarWidth: 'none',
      }}
    >
      {PHASES.map((phase, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent   = idx === currentIdx;
        const isPending   = idx > currentIdx;

        const dotColor = isCompleted
          ? 'var(--color-accent)'
          : isCurrent
          ? 'var(--color-primary)'
          : 'var(--color-border)';

        const labelColor = isCurrent
          ? 'var(--color-ink)'
          : isCompleted
          ? 'var(--color-ink-2)'
          : 'var(--color-ink-3)';

        return (
          <div key={phase.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {/* Connector line before dot (skip first) */}
            {idx > 0 && (
              <div style={{
                height: '2px',
                width: compact ? '16px' : '28px',
                background: isCompleted || isCurrent
                  ? 'var(--color-primary)'
                  : 'var(--color-border)',
                flexShrink: 0,
                transition: 'background var(--transition-base)',
              }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? '3px' : 'var(--space-2)' }}>
              {/* Dot */}
              <div style={{
                width: compact ? '8px' : '14px',
                height: compact ? '8px' : '14px',
                borderRadius: '50%',
                background: dotColor,
                border: isCurrent ? `2px solid var(--color-primary)` : '2px solid transparent',
                boxShadow: isCurrent ? '0 0 0 3px var(--color-primary-light)' : 'none',
                transition: 'all var(--transition-base)',
                flexShrink: 0,
              }} />
              {/* Label */}
              {!compact && (
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: isCurrent ? 'var(--weight-bold)' : 'var(--weight-medium)',
                  color: labelColor,
                  whiteSpace: 'nowrap',
                  transition: 'color var(--transition-base)',
                }}>
                  {phase.short}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
