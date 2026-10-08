/**
 * matching.js — Pure matching algorithm for InternMatch.
 *
 * Exported function: runMatching({ students, postings, studentRankings, companyRankings })
 *
 * Returns: { matches, unmatchedStudents, unmatchedPostings, scoredPairs }
 *
 * Algorithm:
 * 1. For each company ranking row, if `scores` is non-empty, convert scores to
 *    ranks (highest score = rank 1; ties broken by lower student id, alphabetically).
 * 2. For every (studentId, postingId) pair where BOTH sides ranked each other,
 *    compute: score = 1/(student's rank of posting) + 1/(company's rank of student)
 * 3. Sort descending by score; ties: lower student rank of that posting first,
 *    then lower student id (lexicographic) first.
 * 4. Walk the sorted list once:
 *    - If student is free AND posting has remaining capacity → MATCH
 *    - Otherwise → SKIP with reason
 * 5. Return all data.
 *
 * This function has NO side effects and imports nothing — safe to use in tests.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a scores map { [studentId]: number } to an ordered_student_ids array.
 * Highest numeric score → rank 1. Equal scores → sort by student id ascending.
 * @param {Object} scores
 * @returns {string[]} ordered student ids
 */
export function scoresToRanks(scores) {
  if (!scores || Object.keys(scores).length === 0) return [];
  return Object.entries(scores)
    .sort(([idA, scoreA], [idB, scoreB]) => {
      if (scoreB !== scoreA) return scoreB - scoreA;   // higher score first
      return idA < idB ? -1 : idA > idB ? 1 : 0;      // tie → lower id first
    })
    .map(([id]) => id);
}

/**
 * Resolve the effective ordered_student_ids for a company ranking row.
 * If scores is non-empty, those take precedence (converted to ranks).
 * Otherwise use ordered_student_ids directly.
 */
function resolveCompanyOrder(cr) {
  if (cr.scores && Object.keys(cr.scores).length > 0) {
    return scoresToRanks(cr.scores);
  }
  return cr.ordered_student_ids ?? [];
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {object[]} params.students            — array of student objects (need .id)
 * @param {object[]} params.postings            — array of posting objects (need .id, .capacity)
 * @param {object[]} params.studentRankings     — { student_id, ordered_posting_ids[] }
 * @param {object[]} params.companyRankings     — { posting_id, ordered_student_ids[], scores }
 * @returns {{ matches, unmatchedStudents, unmatchedPostings, scoredPairs }}
 */
export function runMatching({ students, postings, studentRankings, companyRankings }) {
  // ── Build lookup maps ──────────────────────────────────────────────────────
  // studentRankMap[studentId][postingId] = 1-based rank position
  const studentRankMap = {};
  for (const sr of studentRankings) {
    studentRankMap[sr.student_id] = {};
    (sr.ordered_posting_ids ?? []).forEach((pid, idx) => {
      studentRankMap[sr.student_id][pid] = idx + 1;
    });
  }

  // companyRankMap[postingId][studentId] = 1-based rank position
  const companyRankMap = {};
  for (const cr of companyRankings) {
    const ordered = resolveCompanyOrder(cr);
    companyRankMap[cr.posting_id] = {};
    ordered.forEach((sid, idx) => {
      companyRankMap[cr.posting_id][sid] = idx + 1;
    });
  }

  // ── Generate scored pairs ──────────────────────────────────────────────────
  // Only pairs where both sides ranked each other.
  const rawPairs = [];

  for (const sr of studentRankings) {
    const sid = sr.student_id;
    for (const pid of (sr.ordered_posting_ids ?? [])) {
      const studentRank  = studentRankMap[sid]?.[pid];
      const companyRank  = companyRankMap[pid]?.[sid];
      if (studentRank == null || companyRank == null) continue; // one side didn't rank
      const score = (1 / studentRank) + (1 / companyRank);
      rawPairs.push({ studentId: sid, postingId: pid, score, studentRank, companyRank });
    }
  }

  // ── Sort: score desc, then studentRank asc, then studentId asc ────────────
  rawPairs.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.studentRank !== b.studentRank) return a.studentRank - b.studentRank;
    return a.studentId < b.studentId ? -1 : a.studentId > b.studentId ? 1 : 0;
  });

  // ── Greedy matching pass ───────────────────────────────────────────────────
  const postingCapacity = {};
  for (const p of postings) {
    postingCapacity[p.id] = p.capacity;
  }

  const matchedStudents  = new Set();
  const matchedPostings  = new Map();   // postingId → remaining capacity
  for (const p of postings) {
    matchedPostings.set(p.id, p.capacity);
  }

  const matches     = [];
  const scoredPairs = [];

  for (const pair of rawPairs) {
    const remainingCap = matchedPostings.get(pair.postingId) ?? 0;
    const studentFree  = !matchedStudents.has(pair.studentId);

    if (studentFree && remainingCap > 0) {
      // MATCH
      matches.push({
        student_id:    pair.studentId,
        posting_id:    pair.postingId,
        mutual_score:  Math.round(pair.score * 10000) / 10000,
        student_rank:  pair.studentRank,
        company_rank:  pair.companyRank,
      });
      matchedStudents.add(pair.studentId);
      matchedPostings.set(pair.postingId, remainingCap - 1);
      scoredPairs.push({ ...pair, matched: true, skipReason: null });
    } else {
      // SKIP
      let skipReason = 'student already matched';
      if (studentFree && remainingCap === 0) skipReason = 'posting full';
      if (!studentFree && remainingCap === 0) skipReason = 'student already matched';
      scoredPairs.push({ ...pair, matched: false, skipReason });
    }
  }

  // ── Collect unmatched ──────────────────────────────────────────────────────
  const allStudentIds  = new Set(students.map(s => s.id));
  const allPostingIds  = new Set(postings.map(p => p.id));

  const unmatchedStudents = [...allStudentIds].filter(sid => !matchedStudents.has(sid));
  const unmatchedPostings = [...allPostingIds].filter(pid => {
    const rem = matchedPostings.get(pid);
    // A posting is "unfilled" if it still has remaining capacity after matching
    return rem == null || rem > 0;
  });

  return { matches, unmatchedStudents, unmatchedPostings, scoredPairs };
}
