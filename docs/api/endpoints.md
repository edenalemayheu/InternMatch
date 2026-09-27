# API Specification

Base URL: `/api`. All authenticated requests require a valid Supabase session JWT in the `Authorization: Bearer <token>` header. Responses are JSON.

## Conventions

- Success responses: `200`/`201` with the resource(s) as JSON.
- Validation errors: `400` with `{ error: string, fields?: object }`.
- Auth errors: `401` (no/invalid session), `403` (valid session, wrong role/phase).
- Not found: `404`.
- Phase-restricted actions attempted outside their allowed phase return `403` with `{ error: "Action not allowed in current phase", currentPhase: string }`.

---

## Auth

### `POST /api/auth/signup`
Body: `{ email, password, role: 'student' | 'company' }`
Creates a Supabase Auth user + a `users` row with the given role. Returns session token.

### `POST /api/auth/login`
Body: `{ email, password }`
Returns session token + `{ role, is_admin, hasProfile }` so the frontend knows where to route.

### `GET /api/rounds/current`
Public. Returns `{ id, label, phase, ranking_opens_at, ranking_locks_at, shortlist_locks_at, company_locks_at, reveal_at }` for the active round.

---

## Students

### `POST /api/students`
Auth: student, no existing profile. Body: `{ full_name, department, year, skills[], portfolio_url, availability }`. Creates the student's profile.

### `GET /api/students/me`
Auth: student. Returns the caller's own profile.

### `PATCH /api/students/me`
Auth: student. Body: partial profile fields. Updates profile (not phase-restricted).

### `GET /api/postings`
Auth: student. Query params: `?all=true` to bypass department/skill filtering. Returns postings for the current round, filtered by the student's department/skills unless `all=true`.

### `POST /api/rankings`
Auth: student. Body: `{ ordered_posting_ids: uuid[] }`. Creates/updates the student's `student_rankings` row for the current round. **Rejected with 403 if `round.phase != 'ranking_open'`.**

### `GET /api/rankings/me`
Auth: student. Returns the caller's current ranking for the active round.

---

## Companies

### `POST /api/companies`
Auth: company, no existing profile. Body: `{ company_name, industry, contact_person, logo_url? }`.

### `POST /api/postings`
Auth: company. Body: `{ title, required_department, required_skills[], capacity }`. Creates a posting tied to the current round.

### `GET /api/postings/mine`
Auth: company. Returns all postings owned by the caller's company.

### `GET /api/postings/:id/applicants`
Auth: company (must own posting `:id`). Returns all students who ranked this posting, with profile detail, sorted by the student's rank position of this posting. **`contact_email` is omitted unless `shortlist_status = 'shortlisted'` and `round.phase >= 'shortlist_locked'`.** Allowed only when `round.phase` is `ranking_locked` or later.

### `PATCH /api/shortlists/:postingId/:studentId`
Auth: company (must own posting). Body: `{ shortlist_status: 'shortlisted' | 'rejected' | 'pending' }`. **Rejected with 403 if `round.phase` is not `ranking_locked` or `shortlisting`.**

### `POST /api/company-rankings`
Auth: company (must own posting). Body: `{ posting_id, ordered_student_ids?: uuid[], scores?: { [studentId]: number } }`. Only accepts student IDs with `shortlist_status = 'shortlisted'`. **Rejected with 403 if `round.phase` is not `interviewing` or `company_ranking`.**

---

## Shared

### `GET /api/notifications`
Auth: any. Returns the caller's notifications, newest first.

### `PATCH /api/notifications/:id/read`
Auth: any (must own notification). Marks as read.

### `GET /api/matches/me`
Auth: student or company. Returns the caller's match result(s). **Returns `403` with `{ error: "Results not yet revealed" }` unless `round.phase == 'revealed'`.**

---

## Admin

All routes below require `requireAdmin` middleware (checks `users.is_admin`), enforced server-side.

### `GET /api/admin/students`
Returns every student profile, all fields, regardless of round phase.

### `GET /api/admin/companies`
Returns every company profile.

### `GET /api/admin/rankings`
Returns all `student_rankings` rows for the current round, regardless of phase.

### `GET /api/admin/company-rankings`
Returns all `company_rankings` rows for the current round, regardless of phase.

### `GET /api/admin/shortlists`
Returns all `shortlists` rows for the current round, regardless of phase.

### `POST /api/admin/rounds/advance-phase`
No body required. Moves `rounds.phase` to the next value in the fixed sequence (see `database.md`), applying any phase-transition side effects (see `function-level-specification/admin-and-auth.md`). Returns the updated round.

### `POST /api/admin/rounds/run-matching`
No body required. Executes `runMatching(roundId)` (see `function-level-specification/matching-algorithm.md`), writes to `matches`, and returns `{ matched: [...], unmatched_students: [...], unmatched_postings: [...] }`.

### `POST /api/admin/rounds/reset`
No body required. Wipes `student_rankings`, `shortlists`, `company_rankings`, and `matches` for the current round, and resets `phase` to `ranking_open`. Returns the reset round.

### `POST /api/admin/seed`
Dev/demo only. Generates 15–20 fake students and 6–8 fake companies/postings with randomized-but-plausible rankings (see seed strategy in `function-level-specification/matching-algorithm.md`). Should be disabled or additionally auth-locked in a real production deployment.
