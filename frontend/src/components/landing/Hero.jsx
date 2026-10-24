/**
 * Hero: headline, the two entry points, and the live match demo.
 * The round line uses real data from RoundContext when it is available.
 */
import { Link } from 'react-router-dom';
import { useRound, PHASE_LABELS } from '@/context/RoundContext';
import MatchDemo from './MatchDemo.jsx';

function roundLine(round) {
  if (!round) return 'Match Day is June 1.';
  try {
    if (round.phase === 'ranking_open' && round.ranking_locks_at) {
      const d = new Date(round.ranking_locks_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      return `${round.label}: ranking closes ${d}.`;
    }
    if (round.phase === 'revealed') return `${round.label}: results are live.`;
    return `${round.label}: ${PHASE_LABELS[round.phase] ?? round.phase}.`;
  } catch {
    return 'Match Day is June 1.';
  }
}

export default function Hero() {
  const { round } = useRound();
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-hero__inner">
        <div className="lp-hero__copy">
          <h1 id="lp-hero-title" className="lp-hero__title">
            Ranked preferences.
            <em>Fair outcomes.</em>
          </h1>
          <p className="lp-hero__lede">
            Students rank the companies they want. Companies rank the students they want.
            One explainable pass pairs everyone by mutual interest.
          </p>
          <div className="lp-hero__ctas">
            <Link to="/signup?role=student" className="lp-btn lp-btn--white">I'm a student</Link>
            <Link to="/signup?role=company" className="lp-btn lp-btn--ghost">I'm a company</Link>
          </div>
          <p className="lp-hero__round">{roundLine(round)}</p>
        </div>

        <MatchDemo />
      </div>
    </section>
  );
}
