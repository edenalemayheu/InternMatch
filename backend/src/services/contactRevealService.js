// Contact-reveal rule (docs/function-level-specification/admin-and-auth.md §3):
// students.contact_email may be included in a company-facing response ONLY IF
//   1) a shortlists row for (that company's posting, student) has status 'shortlisted', AND
//   2) round.phase is 'shortlist_locked' or later.
// The field must be ABSENT from the response otherwise, not just hidden in the UI.
//
// TODO (step 6): implement and use in GET /api/postings/:id/applicants
export function stripContactEmail(student) {
  const { contact_email, ...safe } = student; // eslint-disable-line no-unused-vars
  return safe;
}
