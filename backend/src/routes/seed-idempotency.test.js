import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeSupabase } from '../db/fakeSupabase.js';
import { demoAccounts, seedDemoData } from '../../scripts/seed.js';

test('demo seeding resets existing passwords, confirms users, and includes every demo profile idempotently', async () => {
  const adminId = '10000000-0000-4000-8000-000000000099';
  const db = createFakeSupabase({
    tables: { users: [{ id: adminId, email: 'admin@internmatch.demo', role: 'student', is_admin: true }] },
    accounts: {
      'admin@internmatch.demo': {
        email: 'admin@internmatch.demo',
        password: 'Company123!',
        confirmed: false,
        user: { id: adminId, email: 'admin@internmatch.demo' },
      },
    },
  });

  await seedDemoData(db, () => {});
  await seedDemoData(db, () => {});

  const adminLogin = await db.auth.signInWithPassword({ email: 'admin@internmatch.demo', password: 'Admin123!' });
  assert.equal(adminLogin.error, null);
  assert.equal(db.state.users.find((row) => row.id === adminId).is_admin, true);
  assert.equal(db.state.students.length, 4);
  assert.equal(db.state.companies.length, 2);
  assert.equal(db.state.postings.length, 2);
  assert.equal(db.state.rounds.length, 1);
  assert.equal(db.state.student_rankings.length, 4);
});
