/**
 * print-demo-results.mjs
 * Loads seed data, applies seeded student + company rankings, calls
 * runMatching, and prints results. No browser/localStorage required.
 *
 * Run from frontend/ with:
 *   node scripts/print-demo-results.mjs
 */
import { SEED } from '../src/data/seed.js';
import { runMatching } from '../src/lib/matching.js';

const { students, companies, postings, studentRankings: sr, companyRankings: cr } = SEED;

const result = runMatching({
  students,
  postings,
  studentRankings: sr,
  companyRankings: cr,
});

const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
const companyMap = Object.fromEntries(companies.map(c => [c.id, c]));
const postingMap = Object.fromEntries(postings.map(p => [p.id, p]));

console.log('\n══════════════════════════════════════════════');
console.log('  InternMatch — Demo Seed Match Results');
console.log('══════════════════════════════════════════════\n');

console.log('MATCHED PAIRS');
console.log('─────────────────────────────────────────────');
for (const m of result.matches) {
  const student = studentMap[m.student_id];
  const posting = postingMap[m.posting_id];
  const company = companyMap[posting?.company_id];
  const sName = student?.full_name ?? m.student_id;
  const pTitle = posting?.title ?? m.posting_id;
  const cName = company?.company_name ?? '?';
  console.log(`  ${sName.padEnd(22)} -> ${pTitle.padEnd(30)} [${cName}]  score=${m.mutual_score}`);
}

console.log('\nUNMATCHED STUDENTS');
console.log('─────────────────────────────────────────────');
for (const sid of result.unmatchedStudents) {
  const s = studentMap[sid];
  const ranked = sr.find(r => r.student_id === sid);
  const rankedStr = ranked ? `ranked ${ranked.ordered_posting_ids.length} posting(s)` : 'no ranking submitted';
  console.log(`  ${(s?.full_name ?? sid).padEnd(22)} (${rankedStr})`);
}

console.log('\nUNFILLED POSTINGS (remaining capacity > 0 after matching)');
console.log('─────────────────────────────────────────────');
for (const pid of result.unmatchedPostings) {
  const p = postingMap[pid];
  const company = companyMap[p?.company_id];
  const filled = result.matches.filter(m => m.posting_id === pid).length;
  console.log(`  ${(p?.title ?? pid).padEnd(34)} [${company?.company_name ?? '?'}]  cap=${p?.capacity ?? '?'} filled=${filled}`);
}

console.log('\nTIED SCORES (values appearing >1 time in scoredPairs)');
console.log('─────────────────────────────────────────────');
const scoreCount = {};
for (const pair of result.scoredPairs) {
  const k = pair.score.toFixed(4);
  if (!scoreCount[k]) scoreCount[k] = [];
  const s = studentMap[pair.studentId];
  const p = postingMap[pair.postingId];
  scoreCount[k].push(`${s?.full_name ?? pair.studentId}/${p?.title?.split(' ')[0] ?? pair.postingId} (${pair.matched ? 'matched' : pair.skipReason})`);
}
let tiedCount = 0;
for (const [score, pairs] of Object.entries(scoreCount).sort(([a],[b]) => b-a)) {
  if (pairs.length > 1) {
    console.log(`  score=${score}  (${pairs.length} pairs):`);
    for (const p of pairs) console.log(`    - ${p}`);
    tiedCount++;
  }
}
if (!tiedCount) console.log('  (none)');

console.log('\nSTATISTICS');
console.log('─────────────────────────────────────────────');
console.log(`  Total matches:         ${result.matches.length}`);
console.log(`  Unmatched students:    ${result.unmatchedStudents.length}`);
console.log(`  Unfilled postings:     ${result.unmatchedPostings.length}`);
console.log(`  Total scored pairs:    ${result.scoredPairs.length}`);

// Check: which posting did the most students rank #1?
const firstChoiceCounts = {};
for (const r of sr) {
  if (r.ordered_posting_ids.length > 0) {
    const top = r.ordered_posting_ids[0];
    firstChoiceCounts[top] = (firstChoiceCounts[top] || 0) + 1;
  }
}
const sorted = Object.entries(firstChoiceCounts).sort((a,b) => b[1]-a[1]);
console.log('\nTOP FIRST CHOICES (students who ranked this posting #1)');
console.log('─────────────────────────────────────────────');
for (const [pid, count] of sorted.slice(0, 5)) {
  const p = postingMap[pid];
  const c = companyMap[p?.company_id];
  console.log(`  ${count}x  ${p?.title ?? pid} [${c?.company_name ?? '?'}]`);
}

console.log('\nDEMO CRITERIA CHECK');
console.log('─────────────────────────────────────────────');
const hasEnoughUnmatched = result.unmatchedStudents.length >= 2;
const hasUnfilledPosting = result.unmatchedPostings.length >= 1;
const hasTiedScores      = Object.values(scoreCount).some(p => p.length > 1);
const hasPopularPosting  = sorted.length > 0 && sorted[0][1] >= 3;
console.log(`  >= 2 unmatched students:    ${hasEnoughUnmatched ? 'PASS' : 'FAIL'} (${result.unmatchedStudents.length})`);
console.log(`  >= 1 unfilled posting:      ${hasUnfilledPosting ? 'PASS' : 'FAIL'} (${result.unmatchedPostings.length})`);
console.log(`  >= 2 tied scores:           ${hasTiedScores ? 'PASS' : 'FAIL'}`);
console.log(`  >= 3 students rank same #1: ${hasPopularPosting ? 'PASS' : 'FAIL'} (${sorted[0]?.[1] ?? 0}x ${postingMap[sorted[0]?.[0]]?.title ?? ''})`);
console.log('');
