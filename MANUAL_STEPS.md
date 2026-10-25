# InternMatch manual setup and release steps

1. Copy `backend/.env.example` to `backend/.env`. Set `PORT`, `NODE_ENV`, `FRONTEND_ORIGIN`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role secret only in `backend/.env`.
2. In Supabase Dashboard → SQL Editor, open `backend/sql/4a_auth_profiles.sql`, copy the entire file, paste it into a new SQL Editor query, and click **Run**.
3. Repeat the same copy/paste/run process in order for `backend/sql/4b_postings_rankings.sql`, `backend/sql/4c_rounds_notifications.sql`, `backend/sql/4d_shortlists_notes.sql`, and `backend/sql/4e_matches.sql`.
4. In Supabase Dashboard → Authentication → Providers → Email, disable email confirmation for local development so signup can return a session. Configure the confirmation flow deliberately for production.
5. In Supabase Dashboard → Authentication → URL Configuration, set Site URL to your deployed frontend origin (local development: `http://localhost:5173`) and add the allowed redirect URLs.
6. From the repository root, run `npm install`. Start the API with `npm run dev:backend` and the frontend with `npm run dev:frontend` in separate terminals.
7. Create demo accounts, demo postings, ranked preferences, and a demo round with `npm run seed --prefix backend`. Save the printed demo logins for local use only.
8. On a fresh demo Supabase project, run `npm run e2e` from the repository root. This workflow advances and reveals the active round. It requires `ranking_open` and should not be run against a live round with real applicants.
9. To configure a deployed frontend, set `VITE_API_URL` in `frontend/.env` to the backend URL ending in `/api`.
10. Deployment instructions for the API and frontend are in `DEPLOY.md`. The backend now fails at startup if its Supabase URL/key are missing; production also requires an HTTPS Supabase URL and an explicit `FRONTEND_ORIGIN` list.

## Run the E2E round against real Supabase

The E2E runner talks to the API, so point that API at the real Supabase project through `backend/.env`. The `--reset` flag creates a new round and demo postings; it leaves earlier rounds intact.

1. If the demo accounts do not exist yet, configure `backend/.env` and run this once from the repository root (do not run the seed command in production):

   ```powershell
   npm run seed --prefix backend
   ```

2. Start the local backend in a first PowerShell terminal:

   ```powershell
   npm run dev:backend
   ```

3. In a second PowerShell terminal, run the full flow against that backend and the real Supabase project:

   ```powershell
   $env:API_URL = "http://localhost:3001/api"
   npm run e2e -- --reset
   Remove-Item Env:API_URL
   ```

   For an already-running deployed API, replace the API URL with `https://<your-api-domain>/api`. Ensure the seeded demo accounts exist and use a dedicated demo/test project; this command creates a new round and advances it through reveal.

4. To run without creating a new round, use `npm run e2e` only when the current round is already `ranking_open`. If the runner fails, it prints the failed step and full API response body and exits non-zero.

5. To verify the runner without Supabase or network access, run `node scripts/e2e-round.js --fake`; use `node scripts/e2e-round.js --fake --reset` to test fresh-round mode.

The API contract has no admin create-round endpoint. `backend/scripts/seed.js` creates a demo round only when the database has none.
