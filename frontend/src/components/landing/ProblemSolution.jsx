/**
 * ProblemSolution — "Replace applying with ranking." section.
 * Two-column glass cards with scroll reveal.
 * Copy from internmatch-v4.html.
 */
import { useRef, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import styles from './Landing.module.css';

const PROBLEMS = [
  "Students apply with no sense of where they stand.",
  "Companies evaluate candidates in isolation.",
  "Popular companies get flooded; others can't reach qualified students.",
  "Speed and single metrics beat genuine fit.",
];
const SOLUTIONS = [
  "One ranked list is the whole application.",
  "Both sides state genuine preferences.",
  "Matching is transparent and automated.",
  "Outcomes reflect mutual interest, not who applied first.",
];

export default function ProblemSolution() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add(styles.revealed); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className={`${styles.section} ${styles.revealEl}`} ref={ref} id="problem-solution">
      <div className={styles.container}>
        <p className={styles.eyebrow}>Replace applying with ranking.</p>
        <p className={styles.sectionSub} style={{ marginBottom: 'var(--space-8)' }}>
          Most placement is a one-way street: a student applies, and waits.
        </p>

        <div className={styles.psGrid}>
          <GlassCard padding="var(--space-8)" className={styles.psCard} style={{ borderLeft: '4px solid var(--color-warning)' }}>
            <h3 className={styles.psCardTitle}>
              The problem
            </h3>
            <ul className={styles.psList}>
              {PROBLEMS.map((p, i) => (
                <li key={i} className={styles.psItem}>
                  <span className={styles.psBulletBad} aria-hidden="true">—</span>
                  {p}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard padding="var(--space-8)" className={styles.psCard} style={{ borderLeft: '4px solid var(--color-accent)' }}>
            <h3 className={styles.psCardTitle}>
              InternMatch
            </h3>
            <ul className={styles.psList}>
              {SOLUTIONS.map((s, i) => (
                <li key={i} className={styles.psItem}>
                  <span className={styles.psBulletGood} aria-hidden="true">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
