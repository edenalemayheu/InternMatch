/**
 * Algorithm — "Explainable by design. The mutual interest score." section.
 * Copy + layout from internmatch-v4.html.
 */
import GlassCard from '@/components/GlassCard';
import styles from './Landing.module.css';

export default function Algorithm() {
  return (
    <section className={styles.section} id="algorithm">
      <div className={styles.container}>
        <div className={styles.algoGrid}>

          {/* Left: explanation */}
          <div>
            <p className={styles.eyebrow}>Explainable by design</p>
            <h2 className={styles.sectionHeading} style={{ marginTop: 'var(--space-2)' }}>
              The mutual interest score.
            </h2>
            <p className={styles.algoDesc}>
              Every student–company pair with mutual interest gets a score.
              Pairs are sorted highest first, then walked once: if both sides
              are free, they match.
            </p>

            <GlassCard opaque padding="var(--space-6)" className={styles.formulaBox}>
              <p className={styles.formulaLabel}>score =</p>
              <div className={styles.formulaRow}>
                <div className={styles.fraction}>
                  <span className={styles.fracNum}>1</span>
                  <span className={styles.fracBar} />
                  <span className={styles.fracDen}>student's rank of company</span>
                </div>
                <span className={styles.fracPlus}>+</span>
                <div className={styles.fraction}>
                  <span className={styles.fracNum}>1</span>
                  <span className={styles.fracBar} />
                  <span className={styles.fracDen}>company's rank of student</span>
                </div>
              </div>
            </GlassCard>

            <div className={styles.algoFeatures}>
              {[
                { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, label:'Inspired by Gale–Shapley' },
                { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label:'Rankings locked first' },
                { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>, label:'Reveal to everyone at once' },
              ].map(f => (
                <span key={f.label} className={styles.algoFeature}>
                  {f.svg}{f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: worked example */}
          <GlassCard opaque padding="var(--space-6)">
            <p className={styles.exTitle}>Example pair</p>
            <div className={styles.exGrid}>
              <div className={styles.exCell}>
                <span className={styles.exLabel}>Student ranks NexaTech</span>
                <span className={styles.exRank} style={{ color:'var(--color-blob-blue)' }}>#1</span>
                <span className={styles.exSub}>→ 1/1 = 1.00</span>
              </div>
              <span className={styles.exPlus}>+</span>
              <div className={styles.exCell}>
                <span className={styles.exLabel}>NexaTech ranks student</span>
                <span className={styles.exRank} style={{ color:'var(--color-blob-violet)' }}>#2</span>
                <span className={styles.exSub}>→ 1/2 = 0.50</span>
              </div>
            </div>
            <hr style={{ border:'none', borderTop:'1px solid var(--color-border-subtle)', margin:'var(--space-4) 0' }} />
            <div className={styles.exTotal}>
              <span style={{ fontSize:'var(--text-sm)', color:'var(--color-ink-2)' }}>Mutual score</span>
              <span className={styles.exScore}>1.50</span>
            </div>
            <div className={styles.exBadge}>Matched</div>
          </GlassCard>

        </div>
      </div>
    </section>
  );
}
