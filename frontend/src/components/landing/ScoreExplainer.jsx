/** ScoreExplainer: the formula and the three-step pass, in plain language. */
export default function ScoreExplainer() {
  return (
    <section id="score" className="lp-section lp-score" aria-labelledby="lp-score-title">
      <div className="lp-wrap lp-score__grid">
        <div>
          <h2 id="lp-score-title" className="lp-h2">Every match traces back to one number</h2>
          <p className="lp-formula" aria-label="score equals 1 over the student's rank of the company, plus 1 over the company's rank of the student">
            score = 1 / <i>student's rank</i> + 1 / <i>company's rank</i>
          </p>
          <p className="lp-lede">
            Ben ranks Orbit first and Orbit ranks Ben first: 1/1 + 1/1 = 2.00.
            Ada ranks Pine second and Pine ranks Ada first: 1/2 + 1/1 = 1.50.
            You can walk through any pair live and get the same answer.
          </p>
        </div>

        <ol className="lp-steps">
          <li>
            <h3>Score every pair that ranked each other</h3>
            <p>If only one side ranked the other, there is no pair.</p>
          </li>
          <li>
            <h3>Sort from highest score to lowest</h3>
            <p>Equal scores go to the lower student ID, so rerunning gives the same result.</p>
          </li>
          <li>
            <h3>Walk the list once</h3>
            <p>Match a pair when both sides are still free. A posting keeps matching until its capacity is full.</p>
          </li>
          <li className="lp-steps__aside">
            <p>
              A simplified take on the stable-matching idea behind medical residency placement
              (Gale and Shapley): one sort and one pass, with no propose-and-reject loop.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}
