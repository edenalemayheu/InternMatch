/**
 * Timeline — "Built around Match Day." section.
 * Responsive card GRID (not horizontal scroller).
 * Match Day card spans 2 columns on ≥3-col layout and is yellow-accented.
 */
import GlassCard from '@/components/GlassCard';
import styles from './Landing.module.css';

const EVENTS = [
  {
    range: 'Feb 1 – Feb 28',
    phase: 'Browse & rank',
    desc: 'Companies post openings. Students build their ranked list.',
  },
  {
    range: 'Mar 1 – Mar 20',
    phase: 'Review & shortlist',
    desc: 'Student rankings lock. Companies review profiles and shortlist.',
  },
  {
    range: 'Mar 21 – May 10',
    phase: 'Interviews',
    desc: 'Only shortlisted candidates are interviewed.',
  },
  {
    range: 'May 15',
    phase: 'Company rankings lock',
    desc: 'Final rankings or scores are frozen.',
  },
  {
    range: 'May 20 – May 25',
    phase: 'Algorithm runs',
    desc: 'A buffer to check for edge cases.',
  },
  {
    range: 'June 1',
    phase: 'Match Day',
    desc: 'Results revealed to everyone at the same moment.',
    matchDay: true,
  },
];

export default function Timeline() {
  return (
    <section className={styles.section} id="timeline">
      <div className={styles.container}>
        <h2 className={styles.sectionHeading}>Built around Match Day.</h2>
        <p className={styles.sectionSub}>
          Matched students start their internships right as summer break begins.
        </p>

        <div className={styles.timelineGrid}>
          {EVENTS.map((ev) => (
            <GlassCard
              key={ev.phase}
              padding="var(--space-6)"
              className={`${styles.timelineCard} ${ev.matchDay ? styles.timelineCardMatchDay : ''}`}
            >
              <p className={styles.tlRange}>{ev.range}</p>
              <p className={`${styles.tlPhase} ${ev.matchDay ? styles.tlPhaseMatchDay : ''}`}>
                {ev.phase}
              </p>
              <p className={styles.tlDesc}>{ev.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
