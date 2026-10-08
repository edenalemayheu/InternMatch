/**
 * TwoSides — "Two sides. One fair match." section.
 * Score visualisation with student + recruiter figures.
 */
import GlassCard from '@/components/GlassCard';
import { StudentFigure, RecruiterFigure } from './Illustrations';
import styles from './Landing.module.css';

export default function TwoSides() {
  return (
    <section className={styles.section} id="two-sides">
      <div className={styles.container}>
        <h2 className={styles.sectionHeading}>Two sides. One fair match.</h2>
        <p className={styles.sectionSub}>
          Both sides rank each other, and the algorithm pairs them where interest is mutual.
        </p>

        <div className={styles.twoSidesRow}>
          <GlassCard padding="var(--space-6)" className={styles.sideCard}>
            <StudentFigure width={80} style={{ margin: '0 auto var(--space-3)' }} />
            <h3 className={styles.sideTitle}>Student ranks NexaTech #1</h3>
            <p className={styles.sideSub}>Submits one ranked list of companies they want.</p>
          </GlassCard>

          <div className={styles.scoreCenter} aria-label="Mutual match score 1.50">
            <div className={styles.scoreValue}>1.50</div>
            <div className={styles.scorePill}>mutual match · 1.50</div>
            <div className={styles.scoreFormula}>
              <span>1/1</span><span>+</span><span>1/2</span>
            </div>
          </div>

          <GlassCard padding="var(--space-6)" className={styles.sideCard}>
            <RecruiterFigure width={80} style={{ margin: '0 auto var(--space-3)' }} />
            <h3 className={styles.sideTitle}>NexaTech ranks Student A #2</h3>
            <p className={styles.sideSub}>Submits a ranked list after interviews.</p>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
