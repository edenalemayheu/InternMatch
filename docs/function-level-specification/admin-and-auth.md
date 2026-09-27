# Function-Level Spec: Admin Controls, Round-Phase System & Auth Flow

## 1. Auth Flow

### 1.1 Signup
`POST /api/auth/signup` — creates a Supabase Auth user, then a corresponding `users` row with `role` set from the request body (`student` or `company`) and `is_admin = false`. Role is **never** settable by the client for `is_admin`.

### 1.2 Login
`POST /api/auth/login` — authenticates via Supabase Auth, then looks up the `users` row to return `{ role, is_admin, hasProfile }`. `hasProfile` is computed by checking for an existing row in `students` or `companies` matching `user_id`.

### 1.3 Client-side routing after login
```
if (is_admin) → redirect to /admin
else if (!hasProfile) → redirect to /onboarding
else if (role === 'student') → redirect to /dashboard (student view)
else if (role === 'company') → redirect to /dashboard (company view)
```

### 1.4 Admin provisioning
There is intentionally **no public endpoint** that sets `is_admin = true`. Options, in order of preference for this build:
1. Set `is_admin = true` directly via the Supabase table editor for a specific known user, after they've signed up normally.
2. Run a one-time CLI seed script (`backend/src/scripts/seed.js` or a dedicated `promoteAdmin.js`) that takes a user's email and flips the flag, run manually by the developer — never exposed as an HTTP route.

### 1.5 Server-side enforcement
Every `/admin/*` route must apply `requireAdmin` middleware that re-checks `is_admin` from the database on each request (not from a client-supplied claim). Client-side route redirection is a UX convenience only, not a security boundary.

---

## 2. Round-Phase System

### 2.1 Phase field, not date comparison
`rounds.phase` is an enum column, advanced only through explicit action (currently: the admin "Force advance to next phase" button). The `*_at` timestamp columns on `rounds` (`ranking_opens_at`, etc.) are stored as **reference/target dates only** — no part of the current build compares `NOW()` against them to gate behavior. This is deliberate: it means a demo can move through an entire round's lifecycle in minutes, and a stuck/early/late real-world round can still be advanced manually without needing a database migration.

### 2.2 Fixed phase sequence
```
ranking_open → ranking_locked → shortlisting → shortlist_locked
→ interviewing → company_ranking → company_locked → matched → revealed
```
`advancePhase(roundId)` always moves exactly one step forward in this sequence and rejects the call (400) if already at `revealed`.

### 2.3 Side effects per transition

Implemented in `backend/src/services/phaseTransitions.js`, called by `advancePhase()`:

| New phase | Side effect |
|---|---|
| `ranking_locked` | Set `locked_at` on all `student_rankings` for the round; reject further `POST /api/rankings`. |
| `shortlist_locked` | For every `shortlists` row with `shortlist_status = 'shortlisted'`: create a `notifications` row (`type: 'shortlisted'`) for that student, and mark the pair as contact-eligible (see §3). |
| `company_locked` | Set `locked_at` on all `company_rankings` for the round; reject further submissions. |
| `matched` | If `matches` for this round is empty, automatically call `runMatching(roundId)`; if already run manually, leave existing results in place. |
| `revealed` | For every row in `matches`: create a `notifications` row (`type: 'matched'`) for the student. For every student in `unmatched_students`: create a `notifications` row (`type: 'not_matched'`). Unlock `GET /api/matches/me` for all users. |

Other transitions (`ranking_open → ranking_locked`, `ranking_locked → shortlisting`, `shortlisting → shortlist_locked` is covered above, `interviewing → company_ranking`, `company_ranking → company_locked` is covered above) have no additional side effects beyond the phase change itself.

---

## 3. Contact Reveal Logic

- `students.contact_email` is included in a company-facing API response **only** when both are true:
  1. A `shortlists` row exists for `(posting belonging to that company, that student)` with `shortlist_status = 'shortlisted'`.
  2. `rounds.phase` is `shortlist_locked` or later.
- This check happens in the query/service layer (e.g. a `contactRevealService.js` helper used by `GET /api/postings/:id/applicants`), not as a frontend conditional — the field must not be present in the raw API response at all when the condition isn't met, not just hidden in the UI.
- This reveal is scoped per company: Company A being able to see Student X's email does not mean Company B (who did not shortlist Student X) can.

---

## 4. Admin Dashboard Capabilities (backend responsibilities)

| Capability | Endpoint | Notes |
|---|---|---|
| View all data, any phase | `GET /api/admin/students`, `/companies`, `/rankings`, `/company-rankings`, `/shortlists` | Bypasses all phase-based restrictions; admin-only. |
| Force advance phase | `POST /api/admin/rounds/advance-phase` | Calls `advancePhase()`, described above. |
| Run matching now | `POST /api/admin/rounds/run-matching` | Calls `runMatching()` directly, independent of phase (though normally run at `company_locked`). |
| Reset round | `POST /api/admin/rounds/reset` | Deletes `student_rankings`, `shortlists`, `company_rankings`, `matches` rows for the round; sets `phase` back to `ranking_open`. Requires confirmation on the frontend before calling. |
| Seed demo data | `POST /api/admin/seed` | Dev/demo convenience; generates realistic fake students/companies/rankings per the strategy in `matching-algorithm.md`. |

---

## 5. Path to Production (documented, not built)

To move from "admin-triggered" to "automatic," a future version would add a scheduled endpoint (e.g. triggered by a Vercel Cron job once daily) that:
1. Loads the current round.
2. Compares `NOW()` against the relevant `*_at` field for the current phase.
3. If past due, calls the same `advancePhase()` function the admin button calls.

No new matching or phase logic would be needed — only a scheduler invoking the existing functions. This should be called out explicitly if asked, since it's the cleanest way to demonstrate the current build was designed with production in mind, without needing to build the scheduler now.
