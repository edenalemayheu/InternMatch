# API Specification

This file is the **contract** between the frontend (`frontend/src/lib/apiClient.js`) and the backend (`backend/src/routes/`). Both sides are built from it. If you change an endpoint, change this file in the same commit. Run `node scripts/check-contract.mjs` to confirm that every call the frontend makes is documented here.

Base URL: `/api`. Every response is JSON.

## Conventions

**Envelopes.** Every success response is an object that names what it carries (`{ round }`, `{ postings }`). No endpoint returns a bare array or a bare resource. The frontend relies on these names.

**Authentication.** Authenticated requests send `Authorization: Bearer <token>`, where `<token>` is the Supabase access token returned by login or signup. The backend verifies it with Supabase and then reads `role` and `is_admin` from its own `users` table. It never trusts role claims from the client.

**Errors.** Non-2xx responses always have this shape:

| Status | Body | When |
|---|---|---|
| `400` | `{ "error": "message", "fields": { "<field>": "<message>" } }` | Validation failed. `fields` is optional but should be present for form errors. |
| `401` | `{ "error": "message" }` | No token, invalid token, or expired token. |
| `403` | `{ "error": "message" }` | Valid session, wrong role, or not allowed. |
| `403` | `{ "error": "Action not allowed in current phase", "currentPhase": "<phase>" }` | Right role, wrong round phase. |
| `404` | `{ "error": "message" }` | Not found, or not owned by the caller (the two are not distinguished, so IDs cannot be probed). |
| `500` | `{ "error": "message" }` | Unexpected server error. Never include stack traces or database details. |

**Order of checks.** Every endpoint checks, in this order: authentication (`401`), role (`403`), ownership (`404`), round phase (`403` with `currentPhase`), then the request body (`400` with `fields`). A company asking about someone else's posting therefore always gets `404`, whatever the phase, so IDs cannot be probed.

**Round phases, in order:** `ranking_open`, `ranking_locked`, `shortlisting`, `shortlist_locked`, `interviewing`, `company_ranking`, `company_locked`, `matched`, `revealed`. "At or past X" means the current phase is X or any later one.

**Unknown input.** The server ignores any body field it does not list for an endpoint. In particular it never accepts `id`, `user_id`, `round_id`, `role`, `is_admin` or `contact_email` from a client.

## Shared object shapes

**user** `{ id, email, role: 'student'|'company', is_admin: boolean, hasProfile: boolean }`. `hasProfile` is true once the student or company profile exists. It is always true for admins.

**round** `{ id, label, phase, ranking_opens_at, ranking_locks_at, shortlist_locks_at, company_locks_at, reveal_at, created_at }`

**student** (own profile and admin views) `{ id, user_id, full_name, department, year, skills: string[], portfolio_url: string|null, availability, contact_email, created_at }`

**student, company-facing** (applicants, shortlisted, matches): only `{ id, full_name, department, year, skills, portfolio_url, availability }`, plus `contact_email` **only when the contact-reveal rule allows it** (see the end of this file). Never spread a database row into a response; build it field by field.

**company** `{ id, user_id, company_name, industry, contact_person, logo_url: string|null, created_at }`

**posting** `{ id, company_id, round_id, title, required_department, required_skills: string[], capacity, is_open: boolean, created_at, company_name }`. `required_department` is `""` for "any department". `capacity` is an integer from 1 to 10. `company_name` is joined in by the server.

**ranking** (student) `{ id, student_id, round_id, ordered_posting_ids: string[], locked_at: string|null, created_at }`. Index 0 is the top choice.

**notification** `{ id, user_id, type: 'shortlisted'|'matched'|'not_matched', message, read: boolean, created_at }`

**match** `{ id, round_id, student_id, posting_id, mutual_score: number, created_at }`

---

## Health

### `GET /api/health`
Public. Returns `{ ok: true }`.

---

## Auth

Access tokens from Supabase expire (about one hour by default). Login and signup therefore also return a `refresh_token`, and the frontend renews the session with `POST /api/auth/refresh` instead of logging the user out.

### `POST /api/auth/signup`
Public. Body `{ email, password, role }`.
- `email`: valid email. `password`: at least 8 characters. `role`: exactly `'student'` or `'company'`. Any other role, including `'admin'`, is rejected with `400`. Admins are only created by `npm run promote-admin`.
- Creates the Supabase Auth user and the matching `users` row, then signs the user in.
- `201` `{ token, refresh_token, expires_at, user }`. `expires_at` is a Unix timestamp in seconds.
- `400` with `fields` for a bad email, short password or bad role. `409` `{ error }` if the email is already registered.

### `POST /api/auth/login`
Public. Body `{ email, password }`.
- `200` `{ token, refresh_token, expires_at, user }`.
- `401` `{ error: "Invalid email or password" }` for any failure. Never say which of the two was wrong.

### `POST /api/auth/refresh`
Public. Body `{ refresh_token }`.
- `200` `{ token, refresh_token, expires_at, user }` (the refresh token rotates: store the new one).
- `401` if the refresh token is invalid or expired. The frontend then sends the user to `/login`.

### `GET /api/auth/me`
Auth: any. `200` `{ user }`.

### `POST /api/auth/logout`
Auth: any. Invalidates the session on the server where possible. `200` `{ ok: true }`. The frontend discards its tokens whether or not this succeeds.

### `GET /api/rounds/current`
Public. `200` `{ round }` for the active round (the newest round). `404` if no round exists.

### `POST /api/admin/rounds`
Auth: admin. Body `{ label }`, where `label` is a non-empty string up to 120 characters. Creates a new round in `ranking_open` and makes it the current round. `201` `{ round }`; invalid labels return `400` with `fields.label`.

---

## Students

### `POST /api/students`
Auth: student with no profile yet.
Body `{ full_name, department, year, skills, portfolio_url?, availability }`. All fields except `portfolio_url` are required. `skills` has at least one entry.
- `contact_email` is **set by the server from the account email**. Any value in the body is ignored.
- `201` `{ student }`. `409` if the profile already exists.

### `GET /api/students/me`
Auth: student. `200` `{ student }`, or `{ student: null }` if no profile yet.

### `PATCH /api/students/me`
Auth: student. Body: any subset of `{ full_name, department, year, skills, portfolio_url, availability }`. **Not phase-restricted.**
- `200` `{ student }` (the full updated record).
- `404` if no profile yet (use `POST /api/students`).
- Validation failure: `400 { error, fields }`.

### `GET /api/postings`
Auth: student. Postings of the current round.
- `200` `{ postings, allPostings }`. `allPostings` is always every posting of the round. `postings` is the subset relevant to the student: the posting's `required_department` is empty or equals the student's department, or at least one required skill matches the student's skills. If that subset is empty, `postings` equals `allPostings`.
- With `?all=true`, `postings` is **every** posting (identical to `allPostings`). The My Ranking page uses this to look up details for every posting in a student's list, including ones that are not "relevant" to them.

### `POST /api/rankings`
Auth: student with a profile. Body `{ ordered_posting_ids: string[] }`.
- Creates or replaces the student's ranking for the current round. Each ID must be a posting of the current round, and there must be no duplicates; otherwise `400` with `fields.ordered_posting_ids`. An empty array clears the ranking.
- **Phase: `ranking_open` only**, otherwise `403` with `currentPhase`.
- `200` `{ ok: true }`.

### `GET /api/rankings/me`
Auth: student. `200` `{ ranking }`, or `{ ranking: null }` if none.

---

## Companies

### `POST /api/companies`
Auth: company with no profile yet. Body `{ company_name, industry, contact_person, logo_url? }`. `201` `{ company }`. `409` if it already exists.

### `GET /api/companies/me`
Auth: company. `200` `{ company }`, or `{ company: null }`.

### `PATCH /api/companies/me`
Auth: company. Body: any subset of `{ company_name, industry, contact_person, logo_url }` (`logo_url` may be `null` to clear it). **Not phase-restricted.** `200` `{ company }`. `404` if no profile yet. Validation failure: `400 { error, fields }`.

### `GET /api/companies/stats`
Auth: company. `200` `{ postingsCount, applicantsCount, shortlistedCount }`, counted over the caller's own postings in the current round. `applicantsCount` counts distinct students who ranked any of them.

### `POST /api/postings`
Auth: company with a profile. Body `{ title, required_department, required_skills, capacity }`.
- `title` is required (up to 120 characters). `capacity` is an integer from 1 to 10. `required_department` may be `""`. `required_skills` is a list of strings. Anything else in the body is ignored.
- **Phase: `ranking_open` only**, otherwise `403` with `currentPhase`. Students rank postings, so postings cannot be added once ranking closes.
- The posting is tied to the current round and the caller's company.
- `201` `{ posting }` (including `company_name`).

### `GET /api/postings/mine`
Auth: company. `200` `{ postings }` owned by the caller in the current round.

### `GET /api/postings/:id`
Public. `200` `{ posting }` with the contract posting fields and `is_open`; `404` if it does not exist. Closed postings remain addressable by ID but are omitted from student browse results.

### `PATCH /api/postings/:id`
Auth: company that owns the posting. Body: any subset of `{ title, required_department, required_skills, capacity }`.
- **Phase: `ranking_open` only**, otherwise `403` with `currentPhase`. Students rank postings, so a posting must not change afterwards.
- `200` `{ ok: true }`. `404` if it does not exist or is not the caller's.

### `DELETE /api/postings/:id`
Auth: company that owns the posting. **Phase: `ranking_open` only.** Also removes this posting from every student ranking and deletes its shortlists and company ranking. `200` `{ ok: true }`. `404` as above.

### `POST /api/postings/:id/close`
Auth: owning company. **Phase: `ranking_open` only.** Closes the posting, removes it from existing student rankings, and removes its shortlist, company ranking and interview notes. Idempotent. `200` `{ ok: true }`; `404` if missing or not owned; `403` with `currentPhase` outside `ranking_open`.

### `GET /api/postings/:id/applicants`
Auth: company that owns the posting. **Allowed at or past `ranking_locked`**, otherwise `403` with `currentPhase`.
- `200` `{ applicants }`: every student who ranked this posting, sorted by `rank_position` ascending.
- Each applicant is a **student, company-facing** object plus `rank_position` (1-based) and `shortlist_status` (`'pending'` when no row exists yet).
- `contact_email` is present only under the contact-reveal rule.

### `PATCH /api/shortlists/:postingId/:studentId`
Auth: company that owns posting `:postingId`. Body `{ shortlist_status: 'shortlisted'|'rejected'|'pending' }`.
- `shortlist_status` must be one of the three values, otherwise `400` with `fields.shortlist_status`. The student must have ranked that posting, otherwise `404`.
- **Phase: `ranking_locked` or `shortlisting`**, otherwise `403` with `currentPhase`.
- Creates the shortlist row if it does not exist. `200` `{ ok: true }`.

### `GET /api/postings/:id/shortlisted`
Auth: company that owns the posting.
- `200` `{ students, companyRanking }`.
- `students`: every student with `shortlist_status = 'shortlisted'` for this posting. Each is a **student, company-facing** object plus `shortlist_id` and `notes` (string, `""` if none).
- `companyRanking` is the company's ranking row for this posting, or `null`.
- `contact_email` is present only under the contact-reveal rule.

### `POST /api/company-rankings`
Auth: company that owns the posting. Body `{ posting_id, ordered_student_ids?, scores? }`.
- **Send exactly one** of `ordered_student_ids` (array of student IDs, best first) or `scores` (object `{ "<studentId>": integer 1-10 }`). Both, or neither, is `400`.
- Every ID must belong to a student with `shortlist_status = 'shortlisted'` for this posting, and no ID may appear twice. Scores must be whole numbers from 1 to 10. Any violation is `400` with `fields.ordered_student_ids` or `fields.scores`. A partial list is allowed: students left out are simply not ranked by this company.
- **Phase: `interviewing` or `company_ranking`**, otherwise `403` with `currentPhase`.
- Creates or replaces the row for `(posting, round)`. `200` `{ ok: true }`.

### `PUT /api/postings/:postingId/notes/:studentId`
Auth: company that owns the posting. Body `{ notes: string }` (up to 2000 characters, empty string clears).
- The student must be shortlisted for this posting, otherwise `404`. `notes` longer than 2000 characters is `400` with `fields.notes`. Sending an empty string deletes the note.
- **Phase: `interviewing` or `company_ranking`.**
- Upserts one row in `interview_notes` for `(posting, student)`. `200` `{ ok: true }`.

---

## Shared

### `GET /api/notifications`
Auth: any. `200` `{ notifications }`, newest first, only the caller's own.

### `PATCH /api/notifications/:id/read`
Auth: any. Marks the caller's own notification as read. `200` `{ ok: true }`. `404` if it is not theirs.

### `GET /api/matches/me`
Auth: student or company. **Allowed only when `round.phase = 'revealed'`**, otherwise `403 { error: "Results not yet revealed", currentPhase }`.
- Student: `200` `{ match }`, or `{ match: null }` if unmatched. `match` is a **match** object plus `posting` `{ id, title, required_department, required_skills, capacity }` and `company` `{ id, company_name, contact_person, industry, logo_url }`.
- Company: `200` `{ matches }`, one per matched student on the caller's own postings. Each is a **match** object plus `student` (company-facing, with `contact_email` because a matched student was necessarily shortlisted) and `posting` `{ id, title }`.

---

## Admin

Every route requires an authenticated user with `users.is_admin = true` (`requireAuth` then `requireAdmin`), otherwise `403`. Admin responses may include every field, including `contact_email`.

### `GET /api/admin/students`
`200` `{ students }`: every student profile.

### `GET /api/admin/companies`
`200` `{ companies }`: every company profile.

### `GET /api/admin/rankings`
`200` `{ rankings }`: all student rankings of the current round, regardless of phase.

### `GET /api/admin/company-rankings`
`200` `{ rankings }`: all company rankings of the current round, regardless of phase.

### `GET /api/admin/shortlists`
`200` `{ shortlists }`: all shortlist rows of the current round, regardless of phase.

### `POST /api/admin/rounds/advance-phase`
No body. Moves `rounds.phase` exactly one step forward and applies the transition side effects in `function-level-specification/admin-and-auth.md`. `200` `{ round }` (the updated round). `400` if the phase is already `revealed`.

### `POST /api/admin/rounds/run-matching`
No body. Runs `runMatching(roundId)` (see `function-level-specification/matching-algorithm.md`) regardless of phase. It is idempotent: it clears the round's existing matches first.

`200`:
```json
{
  "matched": [
    { "student_id": "...", "posting_id": "...", "mutual_score": 2.0,
      "student_name": "...", "posting_title": "...", "company_name": "..." }
  ],
  "unmatched_students": [ { "id": "...", "full_name": "..." } ],
  "unmatched_postings": [ { "id": "...", "title": "...", "company_name": "..." } ]
}
```
The names are included because the admin panel displays them.

### `POST /api/admin/rounds/reset`
No body. Deletes this round's student rankings, shortlists, company rankings, interview notes, matches and notifications, and sets the phase back to `ranking_open`. Profiles and postings are kept. `200` `{ ok: true }`.

### `POST /api/admin/seed`
Dev and demo only. Generates fake students, companies, postings and rankings (see `function-level-specification/matching-algorithm.md`). Must refuse to run when `NODE_ENV=production` unless `ALLOW_SEED=true` is set. `200` `{ ok: true }`.

---

## Server-side rules the backend must enforce

The frontend's demo mode is lenient in places. The real backend is not.

1. **Roles.** Every endpoint checks the caller's role from the database and returns `403` otherwise.
2. **Ownership.** A company can read applicants and shortlisted students, change shortlists, write notes and submit rankings **only for its own postings**. A posting that exists but belongs to someone else returns `404`.
3. **Contact reveal.** A student's `contact_email` is included in a company-facing response only when **both** hold: a `shortlists` row for (that company's posting, that student) has status `shortlisted`, **and** the round phase is `shortlist_locked` or later. Otherwise the field must be absent from the JSON, not blank.
4. **Phases.** Every write is checked against the phase rules above. A wrong phase is `403` with `currentPhase`.
5. **Validation.** Check every body: types, lengths, required fields, the 1-10 capacity range, the 1-10 score range, UUID format on IDs, and the allowed values for `department`, `year`, `availability` and `industry` (the lists in `frontend/src/lib/profileOptions.js`). Failures return `400` with `fields`.
6. **Whitelists.** Build every response object field by field. Never return a raw database row to a student or a company.
7. **Secrets.** The service-role key lives only in the backend environment. No endpoint returns it, and error messages never include it.
8. **Admin.** Admin status comes from `users.is_admin` in the database, and can only be set by `npm run promote-admin`.
