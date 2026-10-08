/**
 * Hero — landing page hero section.
 * Faithful to internmatch-v4.html:
 *  - Headline: "Ranked preferences." (ink) + "Fair outcomes." (primary blue + yellow SVG underline)
 *  - Right side: frosted-glass circle containing student + recruiter figures with beating heart badge
 *  - Twinkling sparkle SVGs around the circle
 *  - "Match Day · June 1" accent tag (Caveat font, yellow)
 *  - Round-status banner from RoundContext
 *  - NO match-score card in the hero
 */
import { Link } from 'react-router-dom';
import { useRound } from '@/context/RoundContext';
import { PHASE_META } from '@/components/PhaseBadge';
import { StudentFigure, RecruiterFigure } from './Illustrations';
import styles from './Landing.module.css';

/* Sparkle SVG — small 4-pointed star */
function Sparkle({ size = 20, color = '#FFD23F', style = {} }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 20 20" fill="none"
      aria-hidden="true"
      className={styles.sparkle}
      style={style}
    >
      <path
        d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z"
        fill={color}
      />
    </svg>
  );
}

function RoundBanner() {
  const { round } = useRound();
  if (!round) return null;

  const meta = PHASE_META[round.phase];
  let dateLabel;
  try {
    dateLabel = round.phase === 'ranking_open'
      ? `ranking closes ${new Date(round.ranking_locks_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
      : round.phase === 'revealed'
      ? 'results are live'
      : `current phase: ${meta?.label ?? round.phase}`;
  } catch {
    dateLabel = `current phase: ${meta?.label ?? round.phase}`;
  }

  return (
    <div className={styles.roundBanner}>
      <span className={styles.roundDot} aria-hidden="true" />
      {round.label} round: {dateLabel}
    </div>
  );
}

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* ── Left: copy ──────────────────────────────────────────────── */}
      <div className={styles.heroLeft}>
        <RoundBanner />

        <h1 id="hero-heading" className={styles.heroH1}>
          <span className={styles.heroH1Line1}>Ranked preferences.</span>
          <span className={styles.heroH1Blue}>Fair outcomes.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Students rank the companies they want. Companies rank the students they
          want. A fair matching algorithm finds the best mutual fit for both sides.
        </p>

        <div className={styles.heroCtas}>
          <Link to="/signup?role=student" className="btn btn--primary btn--lg">
            I'm a Student →
          </Link>
          <Link to="/signup?role=company" className="btn btn--secondary btn--lg">
            I'm a Company
          </Link>
        </div>

        <p className={styles.matchDayTag} aria-label="Match Day June 1">
          Match Day · June 1
        </p>
      </div>

      {/* ── Right: frosted circle with figures ──────────────────────── */}
      <div className={styles.heroRight} aria-hidden="true">
        {/* Sparkles around the circle */}
        <Sparkle size={18} color="#FFD23F" style={{ position:'absolute', top:'8%',  left:'12%',  animationDelay:'0s',    animationDuration:'3.2s' }} />
        <Sparkle size={12} color="#FFD23F" style={{ position:'absolute', top:'18%', right:'8%',  animationDelay:'0.6s',  animationDuration:'2.8s' }} />
        <Sparkle size={22} color="#FFD23F" style={{ position:'absolute', top:'5%',  right:'22%', animationDelay:'1.1s',  animationDuration:'3.6s' }} />
        <Sparkle size={10} color="#FFD23F" style={{ position:'absolute', bottom:'15%', left:'8%', animationDelay:'0.3s', animationDuration:'2.5s' }} />
        <Sparkle size={16} color="#FFD23F" style={{ position:'absolute', bottom:'8%', right:'14%', animationDelay:'1.5s', animationDuration:'3.0s' }} />
        <Sparkle size={14} color="var(--color-blob-violet)" style={{ position:'absolute', top:'55%', left:'4%', animationDelay:'0.8s', animationDuration:'4.0s' }} />

        {/* Frosted glass circle */}
        <div className={styles.heroCircle}>
          <div className={styles.heroFigures}>
            <StudentFigure width={120} />

            {/* Beating heart badge between the figures */}
            <div className={styles.heartBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span className={styles.heartLabel}>mutual match</span>
            </div>

            <RecruiterFigure width={120} />
          </div>
        </div>
      </div>
    </section>
  );
}
