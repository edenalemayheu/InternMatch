// The ONLY implementation of the matching algorithm.
// Spec: docs/function-level-specification/matching-algorithm.md
//
// Single-pass GREEDY algorithm (not full Gale-Shapley):
//   score = 1/(student's rank of posting) + 1/(company's rank of student)
//   sort pairs by score desc (ties: student id asc), walk once, respect capacity.
//
// TODO (step 7): build a pure computeMatches(studentRankings, companyRankings, capacities)
// first and test it by hand, then wrap it in runMatching(roundId) with DB reads/writes.
export async function runMatching(/* roundId */) {
  throw new Error('runMatching not implemented yet');
}
