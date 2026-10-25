# Deploy InternMatch

InternMatch deploys as two Vercel projects: the Express API rooted at `backend/`, and the Vite app rooted at `frontend/`. Provision a Supabase project and apply every migration in `MANUAL_STEPS.md` before deploying either project.

## 1. Deploy the API

1. Import the repository as a new Vercel project and set **Root Directory** to `backend`.
2. Keep the repository's `backend/vercel.json` configuration. Vercel serves the Express app as a Node function.
3. Add these Project Environment Variables for Production (and Preview if needed):
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = the Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = the Supabase service-role key
   - `FRONTEND_ORIGIN` = the exact frontend origin, such as `https://internmatch.example.com`; comma-separate additional preview origins
   - `ALLOW_SEED` = `false` or omit it
4. Deploy and check `https://<api-domain>/api/health`. It should return `{"ok":true}`. Startup fails if the Supabase URL/key or production frontend origin is missing or malformed.

## 2. Deploy the frontend

1. Create a second Vercel project from the same repository and set **Root Directory** to `frontend`.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Set the `VITE_API_URL` Project Environment Variable to `https://<api-domain>/api` for Production and any Preview environment that should use the API.
4. Deploy. Add the exact deployed frontend origin to the backend `FRONTEND_ORIGIN` variable, then redeploy the API if you changed it.

## 3. Verify the deployment

1. Open the frontend and create a student or company account.
2. Sign in and complete the role's profile. Confirm the browser's API requests go to the configured API domain and succeed.
3. Sign in with the admin account and create a round before beginning a real round.
4. Do not enable `ALLOW_SEED` in production. For a safe end-to-end run, follow the fresh-project steps in `MANUAL_STEPS.md`.

## Local development

Copy `backend/.env.example` to `backend/.env` and set `NODE_ENV=development`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `FRONTEND_ORIGIN=http://localhost:5173`. Copy `frontend/.env.example` to `frontend/.env` only when overriding the API URL; local Vite defaults to its `/api` proxy at `http://localhost:3001`.

The backend accepts only the configured comma-separated origins. When `FRONTEND_ORIGIN` is unset in development, it allows `http://localhost:5173`; production requires an explicit list. Requests without an `Origin` header remain usable for health checks and server-to-server calls.
