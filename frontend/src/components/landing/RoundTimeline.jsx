/**
 * RoundTimeline: the round as a dated ledger. Dates are the target calendar
 * from the README; in the current build an admin moves each phase.
 */
const STEPS = [
  { when: 'Feb 1',            title: 'The round opens',       text: 'Companies post their openings. Students set up a profile once and reuse it every round.' },
  { when: 'Feb 1 to Feb 28',  title: 'Browse and rank',       text: 'Students see postings that fit their department and skills, then build one ordered list. That list is the application.' },
  { when: 'Mar 1',            title: 'Rankings lock',         text: 'Lists freeze. Each company sees everyone who ranked it, with full profiles.' },
  { when: 'Mar 1 to Mar 20',  title: 'Review and shortlist',  text: 'Companies read profiles at their own pace and narrow to a shortlist. Shortlisted students are told, and only that company gets their email.' },
  { when: 'Mar 21 to May 10', title: 'Interviews',            text: 'Companies interview shortlisted students only. Scheduling stays between the two of them.' },
  { when: 'May 15',           title: 'Company rankings lock', text: 'Final rankings, or a score from 1 to 10 for each interviewed student, are frozen.' },
  { when: 'May 20 to May 25', title: 'Matching runs',         text: 'The admin runs the match and checks edge cases before anything is shown.' },
  { when: 'June 1',           title: 'Match Day',             text: 'Everyone sees their result at the same moment, so internships can start with summer break.', day: true },
];

export default function RoundTimeline() {
  return (
    <section id="round" className="lp-section lp-round" aria-labelledby="lp-round-title">
      <div className="lp-wrap lp-round__grid">
        <div className="lp-round__intro">
          <h2 id="lp-round-title" className="lp-h2">A round, from first profile to Match Day</h2>
          <p className="lp-lede">
            Shortlisting and interviewing are separate on purpose. Reading profiles is quick and
            async. Interviews take real scheduling time, so they only happen for people who made the cut.
          </p>
          <p className="lp-fine">Dates are targets. In this build an admin moves each phase by hand.</p>
        </div>

        <ol className="lp-tl">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`lp-tl__row${s.day ? ' lp-tl__row--day' : ''}`}>
              <span className="lp-tl__when">{s.when}</span>
              <div>
                <h3 className="lp-tl__title">{s.title}</h3>
                <p className="lp-tl__text">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
