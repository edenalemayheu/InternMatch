/** Contrast: the problems from the README next to what ranking changes. */
const ROWS = [
  {
    before: 'Students send applications and wait, with no sense of where they stand.',
    after:  'One ordered list per round replaces every application and cover letter.',
  },
  {
    before: 'Companies judge candidates in isolation, blind to competing interest.',
    after:  'Companies see everyone who ranked them, then interview only their shortlist.',
  },
  {
    before: 'Popular companies are flooded while others struggle to reach qualified students.',
    after:  'Each posting has a capacity, and the match fills it by mutual score, not by who applied first.',
  },
  {
    before: 'Speed and a single metric decide the outcome.',
    after:  'Both sides rank on whole profiles, projects and interviews.',
  },
];

export default function Contrast() {
  return (
    <section id="why" className="lp-section lp-why" aria-labelledby="lp-why-title">
      <div className="lp-wrap">
        <h2 id="lp-why-title" className="lp-h2 lp-why__title">Ranking replaces applying</h2>
        <table className="lp-contrast">
          <caption className="lp-sr">How applying today compares with ranking on InternMatch</caption>
          <thead>
            <tr>
              <th scope="col">Applying today</th>
              <th scope="col">Ranking on InternMatch</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.before}>
                <td data-label="Applying today">{r.before}</td>
                <td data-label="Ranking on InternMatch">{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
