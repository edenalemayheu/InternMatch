# InternMatch completion progress

**NEXT STEP:** Complete Phase 6 readiness (environment validation, strict env-driven CORS, deploy guide) and strengthen the contract checker so it rejects missing or stub handlers.

## Initial repository summary (before implementation)
- The repository is a React/Vite frontend, Express backend, and Supabase Postgres/Auth project. The root README and package scripts describe separate frontend/backend development.
- `docs/api/endpoints.md` is the API contract. `scripts/check-contract.mjs` compares contract paths with frontend calls and backend route declarations.
- The frontend originally had a backend API client alongside a second localStorage/mock data layer and a direct Supabase client. The backend had route and query scaffolds, a matching stub, and no injectable fake data adapter.
- The frontend already contained the tested matching implementation (14 tests). The backend initially had only two implemented API routes.

## Phase 1: backend foundations (committed)
- Added Supabase Auth endpoints, role/profile handling, an injectable Supabase adapter, profile routes, matching logic port and tests, auth/profile SQL, and setup instructions.
- Added SQL migrations for remaining contract resources and frontend API URL configuration; removed the unused frontend Supabase package.
- Commit: `204411c Phase 1: contract-driven backend foundations`.

## Remaining phases completed in the working tree
- Implemented handlers for all 38 contract routes, phase-controlled rankings and posting changes, shortlist/contact visibility, company rankings and notes, notifications, matching persistence and result visibility, admin operations, and demo seeding.
- Added `scripts/e2e-round.js` for a real running backend and an in-memory Supabase workflow integration test covering the contract flow from auth through reveal/reset.
- Removed the unused frontend localStorage/mock data layer and confirmed dead pages/components were not routed or imported. Replaced old data-layer tests with 22 APIClient workflow tests. The frontend's 14 matching tests remain.
- Moved mock fixtures under `frontend/tests/mock/` and constrained APIClient mock mode to Vitest test builds. Production build contains no mock database/matching chunks. Runtime browser calls use `VITE_API_URL` or the local `/api` proxy.
- Removed confirmed-unused backend stubs/query modules and routed admin matching through the backend matching adapter. Fake Supabase supports Auth and the table joins required by route tests.
- `.gitignore` excludes `backend/.env`; `backend/.env.example` lists configuration names only. The Supabase service-role key is read only by backend code.

## Verification
- Contract checker: 38 documented endpoints, 37 frontend calls, 38 backend route declarations. The one documented route not called by the UI is `GET /api/health`.
- Frontend: 77 tests passed across 6 files, including 14 matching tests and 22 APIClient workflow tests. Lint passed with zero rejected emoji.
- Backend: 11 tests passed (6 matching tests, 4 profile route tests, and 1 in-memory full workflow integration test). The workflow integration test verifies missing-token rejection on every protected route and wrong-role rejection on every role-restricted route.
- Production frontend build passed (1,568 modules transformed).
- `backend/.env` is ignored. `git diff --check` identified trailing blank lines in edited files; clean these before commit.
- Real Supabase connectivity/schema application could not be confirmed. The real E2E script was not run against Supabase. The fake-database integration test exercises the complete request flow without external credentials.

## Contract discrepancies and remaining manual steps
1. Added `POST /api/admin/rounds`, public `GET /api/postings/:id`, and owner-only `POST /api/postings/:id/close` across docs, checker-discovered frontend calls, backend routes, API client, and UI. `postings.is_open` is included in `4b_postings_rankings.sql` with an idempotent alter for existing installations.
2. Notification types in the contract are `shortlisted`, `matched`, and `not_matched`; the brief also asks for phase-change/results-available notifications. Implementation follows the contract enum.
3. The contract allows admin matching regardless of phase; the brief restricts matching to locked rounds and refuses re-runs after reveal. Implementation follows the brief.
4. Success coverage includes the new route workflows; the missing-token and wrong-role matrix covers protected endpoints. Validation failures are not yet tested for every endpoint accepting input. Next step is the validation matrix.
5. Applying migrations and running the real Supabase round require the user's Supabase project. Numbered copy/paste steps and commands are in `MANUAL_STEPS.md`.

## Unit 1: requested round and posting endpoints
- Added the three previously missing endpoints and UI/API client entry points.
- Verified: frontend 78 tests, backend 11 tests, contract reports 41 documented endpoints, 40 frontend calls (health is intentionally not used by the UI), and 41 backend routes.
- Commit: pending.

## Unit 2: input validation matrix
- Added reusable UUID path validation on posting, shortlist, notes, and notification routes; validated ranking and company-ranking IDs, login email/password, and the postings `all` query parameter.
- Added backend request assertions for invalid body, query, and path inputs on every endpoint that accepts user input. Paths now return the documented 400 `{ error, fields }` envelope.
- Backend suite: 11 tests passed. Contract checker: 41 documented, 40 frontend calls, 41 backend routes.
- Commit: pending.
