import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createFakeSupabase } from '../db/fakeSupabase.js';

process.env.VERCEL = '1';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

test('login keeps the service-role database client isolated from password sign-in session state', async (t) => {
  const userId = '10000000-0000-4000-8000-000000000003';
  const dbClient = createFakeSupabase({
    tables: { users: [{ id: userId, email: 'admin@test.dev', role: 'student', is_admin: true }] },
    revokeServiceRoleAfterSignIn: true,
  });
  const authClient = createFakeSupabase({
    accounts: {
      'admin@test.dev': {
        email: 'admin@test.dev',
        password: 'Admin123!',
        user: { id: userId, email: 'admin@test.dev' },
      },
    },
  });
  const adapter = await import('../db/supabaseClient.js');
  adapter.setSupabaseForTests(dbClient, authClient);
  const { default: app } = await import('../app.js');
  const server = app.listen(0);
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ' ADMIN@TEST.DEV ', password: 'Admin123!' }),
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  assert.equal(payload.user.id, userId);
  assert.equal(payload.user.is_admin, true);
});
