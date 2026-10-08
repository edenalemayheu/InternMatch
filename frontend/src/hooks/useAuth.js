// TODO (step 2): session + { role, is_admin, hasProfile } from POST /api/auth/login,
// login(), signup(), logout(), and route-protection helpers.
// Routing rule: is_admin -> /admin; else !hasProfile -> /onboarding; else /dashboard.
export function useAuth() {
  return { user: null, loading: false };
}
