/**
 * Sample data and a tiny copy of the scoring rule, used ONLY to animate the
 * landing-page demo.
 *
 * The real matching engine lives in the backend (services/matchingEngine.js,
 * runMatching) and stays the single source of truth. Do not import this file
 * anywhere except the landing page.
 *
 * Rule (docs/function-level-specification/matching-algorithm.md):
 *   score = 1 / (student's rank of company) + 1 / (company's rank of student)
 *   sort by score desc, ties by student ID asc, then one greedy pass.
 * Every company has capacity 1 in this demo.
 */
export const STUDENT_LISTS = {
  Ada: ['Nexa', 'Pine'],
  Ben: ['Orbit', 'Pine'],
  Chi: ['Nexa', 'Orbit'],
  Dev: ['Nexa', 'Orbit'],
};

export const COMPANY_LISTS = {
  Nexa:  ['Chi', 'Dev', 'Ada'],
  Orbit: ['Ben', 'Dev', 'Chi'],
  Pine:  ['Ada', 'Ben'],
};

const round9 = (n) => Math.round(n * 1e9);

/** Returns every mutual pair, highest score first, each with its greedy-pass result. */
export function buildLedger(studentLists = STUDENT_LISTS, companyLists = COMPANY_LISTS) {
  const pairs = [];
  for (const [student, list] of Object.entries(studentLists)) {
    list.forEach((company, i) => {
      const j = (companyLists[company] || []).indexOf(student);
      if (j < 0) return; // not mutual: no pair
      const sr = i + 1;
      const cr = j + 1;
      pairs.push({ student, company, sr, cr, score: 1 / sr + 1 / cr });
    });
  }
  pairs.sort((a, b) => (round9(b.score) - round9(a.score)) || a.student.localeCompare(b.student));

  const matchedStudents = new Set();
  const fullCompanies = new Set();
  return pairs.map((p) => {
    if (matchedStudents.has(p.student)) return { ...p, result: 'skipped', reason: `${p.student} is matched` };
    if (fullCompanies.has(p.company))   return { ...p, result: 'skipped', reason: `${p.company} is full` };
    matchedStudents.add(p.student);
    fullCompanies.add(p.company);
    return { ...p, result: 'matched', reason: '' };
  });
}

export function summarise(ledger, studentLists = STUDENT_LISTS) {
  const matched = ledger.filter((r) => r.result === 'matched');
  const matchedNames = new Set(matched.map((r) => r.student));
  const unmatched = Object.keys(studentLists).filter((s) => !matchedNames.has(s));
  return { matched, unmatched };
}
