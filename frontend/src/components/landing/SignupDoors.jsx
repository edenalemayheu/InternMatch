/**
 * SignupDoors — bottom CTA section. v4 copy exact.
 */
import { Link } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { StudentFigure, RecruiterFigure } from './Illustrations';
import styles from './Landing.module.css';

export default function SignupDoors() {
  return (
    <section className={styles.section} id="get-started">
      <div className={styles.container}>
        <div className={styles.doorsGrid}>

          <GlassCard padding="var(--space-10)" className={styles.doorCard}>
            <StudentFigure width={96} style={{ margin: '0 auto' }} />
            <h2 className={styles.doorH2}>I'm a Student</h2>
            <p className={styles.doorDesc}>
              Build your profile once, rank your dream companies, and let fair matching do the rest.
            </p>
            <Link to="/signup?role=student" className={`btn btn--primary btn--lg ${styles.doorBtn}`}>
              Create student account →
            </Link>
          </GlassCard>

          <GlassCard
            padding="var(--space-10)"
            className={styles.doorCard}
            style={{ borderColor: 'color-mix(in srgb, var(--color-blob-violet) 30%, transparent)' }}
          >
            <RecruiterFigure width={96} style={{ margin: '0 auto' }} />
            <h2 className={styles.doorH2}>I'm a Company</h2>
            <p className={styles.doorDesc}>
              Post your openings, shortlist the best profiles, and rank the candidates you want most.
            </p>
            <Link to="/signup?role=company" className={`btn btn--secondary btn--lg ${styles.doorBtn}`}>
              Create company account →
            </Link>
          </GlassCard>

        </div>
      </div>
    </section>
  );
}
