import { Check } from 'lucide-react';
import { PHASE_SEQUENCE, PHASE_LABELS } from '../../context/RoundContext.jsx';

/** Phase Stepper — horizontal 9-phase progress bar. */
export default function Stepper({ currentPhase }) {
  const currentIdx = PHASE_SEQUENCE.indexOf(currentPhase);

  return (
    <div className="phase-stepper" role="list" aria-label="Round phases">
      {PHASE_SEQUENCE.map((phase, i) => {
        const done    = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div key={phase} className="phase-step" role="listitem">
            {i > 0 && <div className={`phase-step__line ${done || current ? 'phase-step__line--done' : ''}`} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={`phase-step__dot ${done ? 'phase-step__dot--done' : current ? 'phase-step__dot--current' : ''}`}>
                {done ? <Check size={12} /> : i + 1}
              </div>
              <span className={`phase-step__label ${done ? 'phase-step__label--done' : current ? 'phase-step__label--current' : ''} hide-mobile`}>
                {PHASE_LABELS[phase]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
