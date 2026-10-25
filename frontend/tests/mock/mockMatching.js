/**
 * mockMatching.js — Pure matching algorithm.
 * Implements exactly the spec from matching-algorithm.md.
 * This is a pure function with no side effects — structured so it can be
 * copied directly to backend/src/services/matchingEngine.js.
 *
 * Score = 1/studentRank + 1/companyRank (both 1-based).
 * Single greedy pass on sorted pairs, capacity-aware.
 */

/**
 * @param {object} params
 * @param {Array}  params.studentRankings  — [{ student_id, ordered_posting_ids }]
 * @param {Array}  params.companyRankings  — [{ posting_id, ordered_student_ids, scores }]
 * @param {Array}  params.postings         — [{ id, capacity }]
 * @returns {{ matched, unmatched_students, unmatched_postings }}
 */
export function runMatching({ studentRankings, companyRankings, postings }) {
  // Build lookup: postingId → companyRanking
  const crByPosting = {};
  for (const cr of companyRankings) {
    crByPosting[cr.posting_id] = cr;
  }

  // Step 1 — Build mutual-interest pairs
  const pairs = [];
  for (const sr of studentRankings) {
    const { student_id, ordered_posting_ids } = sr;
    for (let si = 0; si < ordered_posting_ids.length; si++) {
      const posting_id = ordered_posting_ids[si];
      const cr = crByPosting[posting_id];
      if (!cr) continue; // company has no ranking for this posting → skip

      let companyRank = null;

      if (cr.ordered_student_ids && cr.ordered_student_ids.length > 0) {
        const ci = cr.ordered_student_ids.indexOf(student_id);
        if (ci === -1) continue; // student not in company's list
        companyRank = ci + 1; // 1-based
      } else if (cr.scores && typeof cr.scores === 'object') {
        if (!(student_id in cr.scores)) continue;
        // Derive rank from scores: sort descending, find position
        const sorted = Object.entries(cr.scores)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0] < b[0] ? -1 : 1; // tie-break by student_id asc
          })
          .map(([id]) => id);
        companyRank = sorted.indexOf(student_id) + 1;
      } else {
        continue;
      }

      const studentRank = si + 1; // 1-based
      const mutual_score = (1 / studentRank) + (1 / companyRank);
      pairs.push({ student_id, posting_id, studentRank, companyRank, mutual_score });
    }
  }

  // Step 2 — Sort by mutual_score desc, tie-break by student_id asc
  pairs.sort((a, b) => {
    if (b.mutual_score !== a.mutual_score) return b.mutual_score - a.mutual_score;
    return a.student_id < b.student_id ? -1 : 1;
  });

  // Step 3 — Single greedy pass
  const matchedStudents = new Set();
  const remainingCapacity = {};
  for (const p of postings) {
    remainingCapacity[p.id] = p.capacity || 1;
  }

  const matched = [];
  for (const pair of pairs) {
    const { student_id, posting_id, mutual_score } = pair;
    if (matchedStudents.has(student_id)) continue;
    if ((remainingCapacity[posting_id] || 0) <= 0) continue;

    matched.push({ student_id, posting_id, mutual_score });
    matchedStudents.add(student_id);
    remainingCapacity[posting_id]--;
  }

  // Step 4 — Compute unmatched
  const allStudentIds = studentRankings.map(sr => sr.student_id);
  const unmatched_students = allStudentIds.filter(id => !matchedStudents.has(id));

  const unmatched_postings = postings
    .filter(p => (remainingCapacity[p.id] || 0) > 0)
    .map(p => p.id);

  return { matched, unmatched_students, unmatched_postings };
}
