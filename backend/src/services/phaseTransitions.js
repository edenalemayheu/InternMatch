// Round phase system. See docs/function-level-specification/admin-and-auth.md §2
export const PHASES = [
  'ranking_open',
  'ranking_locked',
  'shortlisting',
  'shortlist_locked',
  'interviewing',
  'company_ranking',
  'company_locked',
  'matched',
  'revealed',
];

export function phaseIndex(phase) {
  return PHASES.indexOf(phase);
}

/** true if `current` is the same as or later than `target` */
export function isAtOrPast(current, target) {
  return phaseIndex(current) >= phaseIndex(target);
}

export function nextPhase(current) {
  const i = phaseIndex(current);
  return i >= 0 && i < PHASES.length - 1 ? PHASES[i + 1] : null;
}

// TODO (step 4): advancePhase(roundId)
//  - move exactly one step forward, reject (400) if already 'revealed'
//  - apply side effects per docs (lock rankings, create notifications, auto-run matching)
export async function advancePhase(/* roundId */) {
  throw new Error('advancePhase not implemented yet');
}
