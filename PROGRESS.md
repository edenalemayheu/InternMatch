# InternMatch completion progress

## Initial repository summary (before implementation)
- The repository is a React/Vite frontend, Express backend, and Supabase Postgres/Auth project. The root README documents the product and flow; package scripts currently run the frontend build but provide no shared lint or test command.
- The source of truth is `docs/api/endpoints.md`; `scripts/check-contract.mjs` compares that contract against frontend calls and backend route declarations. The checker currently documents 38 routes (baseline implementation count is recorded below after running it).
- The backend has route modules and database query modules for auth, profiles, postings, rankings, rounds, shortlists, notes, notifications, and matches, but several are scaffolds. In particular `backend/src/routes/auth.routes.js` only implements current-round lookup and `backend/src/services/matchingEngine.js` throws as unimplemented.
- The frontend contains `frontend/src/lib/apiClient.js` plus `frontend/src/data/api.js`, seed/storage/mock DB modules, a direct Supabase client, and Vitest tests including the 14-test matching suite in `frontend/src/lib/matching.test.js`.
- The existing backend has no visible test command or fake database adapter. It already includes Supabase query modules and initial schema SQL. `.gitignore` ignores `.env` files and explicitly permits `.env.example`; `backend/.env.example` exists.
- Initial discrepancies/risks: docs describe the full endpoint contract while the backend implementation is incomplete; frontend still has mock/localStorage/Supabase artifacts; company/student phase names and response behavior must follow `docs/api/endpoints.md`.

## Baseline
- Pending: contract checker, frontend tests/build/lint, git status, and precise route count.
- No application files have been changed yet.

## Baseline verification
- Contract: 38 documented endpoints, 37 frontend calls, 2 backend routes; 36 missing backend routes.
- Frontend matching suite: 14 tests pass; other frontend suites were also run as part of the full Vitest command.
- First sandboxed Vite run could not read the config due sandbox filesystem access. Approved out-of-sandbox production build exposed a misplaced CSS import; fixed below.

## Phase 1 progress: auth, profiles, and matching foundation
- Added signup, login, refresh, current-user, and logout handlers using Supabase Auth and the `users` role row; account roles are server-owned.
- Added student and company profile create/read/update routes with input whitelists, role checks, field validation, and contact email sourced from the verified account.
- Added injectable Supabase adapter boundary, so application code can use a fake client in tests without changing route imports.
- Added idempotent `backend/sql/4a_auth_profiles.sql` and `MANUAL_STEPS.md` setup instructions. `backend/.env.example` lists variable names with empty values; `.gitignore` explicitly ignores `backend/.env`.
- Copied the tested frontend matching implementation into `backend/src/matching/`, added explicit posting-id tie-break and a DB persistence wrapper. Added six backend pure matching tests; frontend's 14 matching tests remain in place.
- Removed the unused frontend Supabase client/package and updated the lockfile. Added emoji lint to the frontend test command and fixed its false positive on inline comments. Fixed CSS import order found by the production build.
- Added migration files `4b`–`4e` for the remaining requested tables so the manual migration paths exist; the API handlers and run-summary persistence for those features remain to be completed.

## Current verification and remaining work
- Contract checker: 38 documented, 37 frontend calls, 13 backend route declarations; 25 backend endpoints remain.
- Backend pure matching tests: 6 passed.
- Frontend lint reports 0 emoji violations. Production build passes after the CSS import fix.
- Endpoint-level fake database tests are not yet in place; profile/auth endpoints still need success, validation, 401, and 403 coverage.
- Remaining phases: postings/rankings; round state and notifications; company shortlist/ranking/notes; persisted matching/admin/reveal; replace frontend mock fallback and dead data layer, then implement/run the full E2E workflow.
- No Supabase project credentials or applied SQL have been verified. Manual Supabase setup and real E2E remain user-side steps in `MANUAL_STEPS.md`.

## Current implementation update
- Backend route declarations now cover all 38 documented endpoints, and `node scripts/check-contract.mjs` reports 38/38. The checker validates route declarations only; it does not prove handlers work.
- Implemented handlers now include student/company profiles, postings, student rankings, applicant pools, shortlists, company rankings, interview notes, notifications, matches, admin round advance/reset/matching/list views, and the guarded seed endpoint. Several handlers and Supabase query shapes still need integration tests and fixes against a live schema.
- Added a re-runnable demo seeder at `backend/scripts/seed.js` and a real-API round runner at `scripts/e2e-round.js`. The E2E script requires a fresh `ranking_open` demo round; it deliberately fails if the active round is already in another phase to avoid mutating a live round.
- Added SQL scripts `backend/sql/4b_postings_rankings.sql` through `4e_matches.sql`; added `round_id` to notifications to support round-scoped cleanup.
- Frontend suite: 77 tests passed across 6 files, including the original 14 matching tests. Backend suite: 10 tests passed (6 pure matching, 4 fake-database profile route tests). Frontend lint: 0 emoji violations. Production build passed after correcting the late CSS import.
- Supabase environment variable names are present in the ignored local backend environment, but read-only checks could not confirm that the network/database schema is reachable. No live E2E run was made and no credentials were printed.

## Contract and requested-feature discrepancies to resolve
1. The contract documents `GET /api/postings` as student-authenticated and has no `GET /api/postings/:id`; the brief asks for public listing and a single-posting endpoint. The implementation follows the contract.
2. The contract has no admin create-round endpoint; it exposes current round plus one-step phase advance. The seed script creates a first demo round only when none exists.
3. The contract notification type is limited to `shortlisted`, `matched`, and `not_matched`; the brief also asks for phase-change/results-available notifications. Current notifications follow the contract enum.
4. The brief asks to close postings, but the contract/schema has no closed status or close endpoint. Posting edits/deletes remain restricted to `ranking_open`.
5. The checker sees 38 route declarations, but backend route-level tests for success, validation, 401, and 403 are not complete. The full frontend still contains mock fallbacks and mock-specific suites, so the requested dead-layer removal and real-backend frontend migration remain outstanding.


6. The contract says admin matching may run in any phase; the brief restricts it to locked rounds and refuses runs after reveal. The backend follows the brief: only company_locked and matched are accepted, and evealed is refused.

