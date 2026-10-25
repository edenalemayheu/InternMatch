# InternMatch completion progress

**NEXT STEP:** Point `API_URL` at the local API connected to the demo Supabase project and run `npm run e2e -- --reset`; see the commands at the end of `MANUAL_STEPS.md`.

## Initial repository summary (before implementation)
- The repository is a React/Vite frontend, Express backend, and Supabase Postgres/Auth project. The root README and package scripts describe separate frontend/backend development.
- `docs/api/endpoints.md` is the API contract. `scripts/check-contract.mjs` compares contract paths with frontend calls and backend route declarations.
- The frontend originally had a backend API client alongside a second localStorage/mock data layer and a direct Supabase client. The backend had route and query scaffolds, a matching stub, and no injectable fake data adapter.
- The frontend already contained the tested matching implementation (14 tests). The backend initially had only two implemented API routes.

## Phase 1: backend foundations (committed)
- Added Supabase Auth endpoints, role/profile handling, an injectable Supabase adapter, profile routes, matching logic port and tests, auth/profile SQL, and setup instructions.
- Added SQL migrations for remaining contract resources and frontend API URL configuration; removed the unused frontend Supabase package.
- Commit: `204411c Phase 1: contract-driven backend foundations`.

## Remaining phases completed
- Implemented handlers for all 41 contract routes, phase-controlled rankings and posting changes, shortlist/contact visibility, company rankings and notes, notifications, matching persistence and result visibility, admin operations, and demo seeding.
- Added `scripts/e2e-round.js` for a real running backend and an in-memory Supabase workflow integration test covering the contract flow from auth through reveal/reset.
- Removed the unused frontend localStorage/mock data layer and confirmed dead pages/components were not routed or imported. Replaced old data-layer tests with 22 APIClient workflow tests. The frontend's 14 matching tests remain.
- Moved mock fixtures under `frontend/tests/mock/` and constrained APIClient mock mode to Vitest test builds. Production build contains no mock database/matching chunks. Runtime browser calls use `VITE_API_URL` or the local `/api` proxy.
- Removed confirmed-unused backend stubs/query modules and routed admin matching through the backend matching adapter. Fake Supabase supports Auth and the table joins required by route tests.
- `.gitignore` excludes `backend/.env`; `backend/.env.example` lists configuration names only. The Supabase service-role key is read only by backend code.

## Verification
- Contract checker: 41 documented endpoints, 40 frontend calls, 41 backend routes with real callbacks. It runs the in-memory HTTP route tests; all 5 route integration cases pass. The one documented route not called by the UI is `GET /api/health`.
- Repository test command: 4 checker tests, 78 frontend tests across 6 files, and 14 backend tests all pass. This includes the 14 matching tests, 23 APIClient workflow tests, route validation cases, environment checks, and CORS allow/deny checks. Lint passed with zero rejected emoji.
- Production frontend build passed (1,568 modules transformed).
- `backend/.env` is ignored and `git diff --check` is clean.
- Real Supabase connectivity/schema application could not be confirmed. The real E2E script was not run against Supabase. The fake-database integration test exercises the complete request flow without external credentials.

## Contract discrepancies and remaining manual steps
1. Added `POST /api/admin/rounds`, public `GET /api/postings/:id`, and owner-only `POST /api/postings/:id/close` across docs, checker-discovered frontend calls, backend routes, API client, and UI. `postings.is_open` is included in `4b_postings_rankings.sql` with an idempotent alter for existing installations.
2. Notification types in the contract are `shortlisted`, `matched`, and `not_matched`; the brief also asks for phase-change/results-available notifications. Implementation follows the contract enum.
3. The contract allows admin matching regardless of phase; the brief restricts matching to locked rounds and refuses re-runs after reveal. Implementation follows the brief.
4. Validation tests cover invalid body, query, and path inputs on all endpoints that accept input. Protected endpoints have missing-auth checks and role-restricted endpoints have wrong-role checks.
5. Applying migrations and running the real Supabase round require the user's Supabase project. Numbered copy/paste steps and commands are in `MANUAL_STEPS.md`.

## Unit 1: requested round and posting endpoints
- Added the three previously missing endpoints and UI/API client entry points.
- Verified: frontend 78 tests, backend 11 tests, contract reports 41 documented endpoints, 40 frontend calls (health is intentionally not used by the UI), and 41 backend routes.
- Commit: `af289fb Phase 3: add round and posting lifecycle endpoints`.

## Unit 2: input validation matrix
- Added reusable UUID path validation on posting, shortlist, notes, and notification routes; validated ranking and company-ranking IDs, login email/password, and the postings `all` query parameter.
- Added backend request assertions for invalid body, query, and path inputs on every endpoint that accepts user input. Paths now return the documented 400 `{ error, fields }` envelope.
- Backend suite: 11 tests passed. Contract checker: 41 documented, 40 frontend calls, 41 backend routes.
- Commit: `7a48c58 Phase 4: validate endpoint inputs consistently`.

## Unit 3: Phase 6 deployment readiness
- `/api/health` was already implemented and is exercised by the backend integration test.
- Restricted CORS to exact `FRONTEND_ORIGIN` values, supports comma-separated origins, defaults development to localhost, and denies browser origins outside the allowlist.
- Added fail-fast environment checks for Supabase URL/service key, HTTPS in production, required production CORS origins, and malformed origin entries.
- Added `DEPLOY.md` for the split Vercel frontend/API deployment and linked it from `MANUAL_STEPS.md`.
- Backend suite: 14 tests passed, including environment and CORS tests. Contract checker remains at 41 documented/implemented routes.
- Commit: `158cbe3 Phase 5: add deployment readiness checks and guide`.

## Unit 4: executable contract checker
- The checker inspects every route callback, fails when a route has no response-capable handler or contains a TODO/501 stub, and fails if a documented endpoint has no backend registration.
- It runs backend HTTP integration tests using the fake Supabase adapter before passing, so checker success includes executable handler behavior.
- Added four checker unit tests for real callbacks, missing/empty/stub handlers, named helper handlers, and commented-out declarations.
- Final verification: the repository test command passed (96 tests total), contract checker passed with 41 real handlers, production build passed, and `git diff --check` passed.
- Commit: `Phase 6: verify real backend handlers in contract checker`.

## E2E runner repair
- Fixed the accidental nested invocation that made `scripts/e2e-round.js` exit without starting `main()`.
- Added per-operation PASS/FAIL output, full parsed HTTP response bodies for non-2xx and validation failures, explicit unreachable/no-open-round errors, API URL and round reporting, and an exit code of 1 on any failed or unrun workflow.
- The runner now advances in the legal order: lock student rankings, shortlist during `shortlisting`, lock shortlist, interview, rank, lock company rankings, run matching, mark matched, reveal, and verify persisted student/company match reads.
- Added `--reset` to create a new `ranking_open` round before creating its demo postings and running the flow. `--fake` runs the same flow against the in-memory Supabase adapter without touching a remote project.
- Verified `node scripts/e2e-round.js --fake` and `node scripts/e2e-round.js --fake --reset` both completed with four persisted matches. A dead API URL printed `FAIL API_UNREACHABLE` and exited 1.
- Commit: `9352c4d Fix E2E round runner and reset flow`.
