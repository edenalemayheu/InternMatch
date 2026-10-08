/**
 * HowItWorks — "How a round works. Six steps." section.
 * Grid with staggered scroll reveal per card.
 * Copy from internmatch-v4.html.
 */
import { useRef, useEffect } from 'react';
import styles from './Landing.module.css';

const STEPS = [
  { letter:'P', color:'var(--color-blob-blue)',   title:'Profile, once',
    desc:'Department, year, skills, projects, certificates and portfolio, reused every round.' },
  { letter:'B', color:'var(--color-blob-violet)', title:'Filtered browsing',
    desc:'See postings for your department and skills first, or view the full list.' },
  { letter:'R', color:'var(--color-blob-coral)',  title:'Ranking is the application',
    desc:'Submit one ordered list of postings. That list is your application.' },
  { letter:'S', color:'var(--color-blob-blue)',   title:'Review & shortlist',
    desc:'Companies review every applicant profile at their own pace and narrow to a shortlist.' },
  { letter:'I', color:'var(--color-blob-violet)', title:'Interviews',
    desc:'Only shortlisted candidates are interviewed, in whatever format the company chooses.' },
  { letter:'M', color:'var(--color-accent)',      title:'Final ranking & match',
    desc:'Companies submit rankings or 1–10 scores. Rankings lock, then the algorithm runs.' },
];

export default function HowItWorks() {
  const cardRefs = useRef([]);

  useEffect(() => {
    const observers = cardRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setTimeout(() => el.classList.add(styles.revealed), i * 70); obs.disconnect(); } },
        { threshold: 0.08 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.container}>
        <h2 className={styles.sectionHeading}>How a round works.</h2>
        <p className={styles.sectionSub}>Six steps, from one profile to one reveal.</p>

        <div className={styles.stepsGrid}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              ref={el => cardRefs.current[i] = el}
              className={`${styles.stepCard} ${styles.revealEl}`}
            >
              <div
                className={styles.stepLetter}
                style={{
                  color: s.color,
                  background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                  borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`,
                }}
              >
                {s.letter}
              </div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
