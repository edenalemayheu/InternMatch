/**
 * MatchDemo: the hero's live example. Press "Run the match" and watch the
 * scored pairs resolve one by one, exactly as a real round does.
 * Sample data only (see matchDemoData.js).
 */
import { useEffect, useMemo, useState } from 'react';
import { buildLedger, summarise, STUDENT_LISTS, COMPANY_LISTS } from './matchDemoData.js';
import { prefersReducedMotion } from './useLandingTheme.js';

const STEP_MS = 650;

function RankList({ title, lists }) {
  return (
    <div>
      <h3 className="lp-demo__listTitle">{title}</h3>
      <ul className="lp-demo__list">
        {Object.entries(lists).map(([name, order]) => (
          <li key={name}>
            <b>{name}</b>
            <span>{order.join(' \u203A ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchDemo() {
  const ledger = useMemo(() => buildLedger(), []);
  const { matched, unmatched } = useMemo(() => summarise(ledger), [ledger]);
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const done = shown >= ledger.length;

  useEffect(() => {
    if (!running) return undefined;
    if (done) { setRunning(false); return undefined; }
    const t = setTimeout(() => setShown((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [running, shown, done]);

  function run() {
    if (prefersReducedMotion()) { setShown(ledger.length); return; }
    setShown(0);
    setRunning(true);
  }

  const buttonLabel = running ? 'Matching' : done ? 'Run it again' : 'Run the match';

  return (
    <section className="lp-demo" aria-labelledby="lp-demo-title">
      <header className="lp-demo__head">
        <h2 id="lp-demo-title" className="lp-demo__title">One round, in miniature</h2>
        <p className="lp-demo__note">Sample data. A real round uses the same rule on locked rankings.</p>
      </header>

      <div className="lp-demo__lists">
        <RankList title="Students rank" lists={STUDENT_LISTS} />
        <RankList title="Companies rank" lists={COMPANY_LISTS} />
      </div>

      <div className="lp-demo__tablewrap">
        <table className="lp-ledger">
          <caption className="lp-sr">
            Pairs where both sides ranked each other, highest score first
          </caption>
          <thead>
            <tr>
              <th scope="col">Score</th>
              <th scope="col">Pair</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row, i) => {
              const resolved = i < shown;
              const state = resolved ? row.result : (running && i === shown ? 'active' : 'pending');
              return (
                <tr key={`${row.student}-${row.company}`} className={`lp-ledger__row lp-ledger__row--${state}`}>
                  <td className="lp-ledger__score">
                    <span>{row.score.toFixed(2)}</span>
                    <small>1/{row.sr} + 1/{row.cr}</small>
                  </td>
                  <td className="lp-ledger__pair">
                    <b>{row.student}</b> + {row.company}
                  </td>
                  <td className="lp-ledger__result">
                    {resolved && row.result === 'matched' && <span className="lp-chip lp-chip--match">Matched</span>}
                    {resolved && row.result === 'skipped' && (
                      <>
                        <span className="lp-chip">Skipped</span>
                        <small>{row.reason}</small>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="lp-demo__foot">
        <button type="button" className="lp-btn lp-btn--gold" onClick={run} disabled={running} aria-busy={running}>
          {buttonLabel}
        </button>
        <p className="lp-demo__tie">Equal scores go to the lower student ID first, so a rerun never changes the result.</p>
      </div>

      <div className="lp-demo__result" aria-live="polite">
        {done && (
          <p>
            <b>{matched.length} matched.</b>{' '}
            {matched.map((r) => `${r.student} with ${r.company}`).join(', ')}.{' '}
            {unmatched.length > 0 && (
              <>
                {unmatched.join(', ')} {unmatched.length === 1 ? 'is' : 'are'} not matched this round and can rank again next round.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
