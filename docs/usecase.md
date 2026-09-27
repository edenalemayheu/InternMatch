# Use Cases

Actors: **Student**, **Company**, **Admin**

---

## UC-1: Student completes profile

**Actor:** Student
**Precondition:** Student has signed up and has no existing profile.
**Flow:**
1. Student is redirected to `/onboarding` after signup.
2. Student fills in: name, department, year, skills, portfolio URL, availability.
3. Student submits the form.
**Postcondition:** A `students` row is created, linked to the user's account. Student is redirected to `/dashboard`.
**Alternate flow:** Student can return to edit their profile at any time via `/dashboard` → "Edit Profile"; profile edits are not phase-restricted.

## UC-2: Student browses postings

**Actor:** Student
**Precondition:** Round phase is `ranking_open`.
**Flow:**
1. Student navigates to `/postings`.
2. System shows postings filtered by the student's department/skills by default.
3. Student can toggle "Show all postings" to remove the filter.
**Postcondition:** Student has a working list of postings to consider ranking.

## UC-3: Student submits ranked list

**Actor:** Student
**Precondition:** Round phase is `ranking_open`.
**Flow:**
1. Student navigates to `/rank`.
2. Student adds postings to an ordered list (drag-to-reorder or numbered selection).
3. Student submits the list.
**Postcondition:** A `student_rankings` row is created/updated with `ordered_posting_ids[]`.
**Exception:** If round phase is not `ranking_open`, the ranking form is disabled/read-only with an explanation of the current phase.

## UC-4: Company creates a posting

**Actor:** Company
**Precondition:** Company has completed onboarding.
**Flow:**
1. Company navigates to `/company/postings`.
2. Company fills in title, required department, required skills, capacity.
3. Company submits.
**Postcondition:** A `postings` row is created, tied to the current round.

## UC-5: Company reviews applicants and shortlists

**Actor:** Company
**Precondition:** Round phase is `ranking_locked` or `shortlisting`.
**Flow:**
1. Company navigates to `/company/applicants/:postingId`.
2. System shows every student who ranked this posting, along with full profile detail.
3. Company sets each applicant's status to `shortlisted` or `rejected` (default `pending`).
**Postcondition:** `shortlists` rows are updated. When phase advances to `shortlist_locked`, shortlisted students are notified and their contact email becomes visible to this company.
**Exception:** Attempting to change shortlist status outside the allowed phases returns an error and the UI shows the fields as locked.

## UC-6: Company interviews and submits final ranking

**Actor:** Company
**Precondition:** Round phase is `interviewing` or `company_ranking`; student has `shortlist_status = shortlisted`.
**Flow:**
1. Company navigates to `/company/interviews/:postingId`.
2. Company sees only shortlisted candidates, with a free-text notes field.
3. Company records interview notes and submits a final rank/score for each candidate.
4. Company submits their overall ranking before `company_locks_at`.
**Postcondition:** A `company_rankings` row is created/updated with `ordered_student_ids[]` or scores.

## UC-7: Student is shortlisted and interviews

**Actor:** Student
**Precondition:** A company has marked the student `shortlisted`, and round phase has reached `shortlist_locked`.
**Flow:**
1. Student receives an in-app + email notification: "You've been shortlisted by [Company]."
2. The company can now see the student's contact email and reaches out directly (email/phone/calendar tool of their choice).
3. Interview happens off-platform.
**Postcondition:** No further platform action required until reveal.

## UC-8: Round reveal

**Actor:** Student, Company
**Precondition:** Round phase is `revealed`.
**Flow:**
1. Student/Company navigates to `/reveal` or is shown the result on their dashboard.
2. Student sees their matched company/posting, or a "not matched this round" message.
3. Company sees the list of students matched to each of its postings.
**Postcondition:** Both sides have visibility into the outcome; unmatched students/postings are informed they are eligible again next round.

## UC-9: Admin advances round phase

**Actor:** Admin
**Precondition:** Admin is logged in; round is not already at `revealed`.
**Flow:**
1. Admin opens `/admin`.
2. Admin clicks "Force advance to next phase."
3. System validates the transition, applies any phase side effects (e.g., locking rankings, sending notifications), and updates `rounds.phase`.
**Postcondition:** Round phase moves to the next value in the sequence; dependent UI across the app updates accordingly.

## UC-10: Admin runs the matching algorithm

**Actor:** Admin
**Precondition:** Round phase is `company_locked` (or later, for re-running).
**Flow:**
1. Admin clicks "Run matching algorithm now."
2. System executes `runMatching(roundId)`.
3. System displays matched pairs, unmatched students, and unmatched postings.
**Postcondition:** `matches` table is populated for the round. Admin can inspect results before advancing to `revealed`.

## UC-11: Admin resets a round

**Actor:** Admin
**Precondition:** Admin is logged in.
**Flow:**
1. Admin clicks "Reset round."
2. System shows a confirmation dialog.
3. On confirmation, system wipes `student_rankings`, `shortlists`, `company_rankings`, and `matches` for the current round, and resets `phase` to `ranking_open`.
**Postcondition:** Round is back to a clean testable state, without needing a fresh database.

## UC-12: Admin views full round data (any phase)

**Actor:** Admin
**Precondition:** Admin is logged in.
**Flow:**
1. Admin views read-only tables of all student rankings, all company rankings, and all shortlist statuses — regardless of current phase.
**Postcondition:** Admin can narrate/debug the state of the round at any point, including during a live demo.
