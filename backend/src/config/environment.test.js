import test from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeEnvironment } from './environment.js';

test('development requires the backend Supabase URL and service key', () => {
  assert.throws(() => getRuntimeEnvironment({ NODE_ENV: 'development' }), /SUPABASE_URL.*SUPABASE_SERVICE_ROLE_KEY/);
  assert.deepEqual(getRuntimeEnvironment({ NODE_ENV: 'development', SUPABASE_URL: 'http://localhost:54321', SUPABASE_SERVICE_ROLE_KEY: 'local-key' }), { allowedOrigins: ['http://localhost:5173'] });
});

test('production requires HTTPS Supabase and an explicit frontend origin', () => {
  const base = { NODE_ENV: 'production', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-only' };
  assert.throws(() => getRuntimeEnvironment(base), /FRONTEND_ORIGIN/);
  assert.throws(() => getRuntimeEnvironment({ ...base, FRONTEND_ORIGIN: 'https://app.example.com', SUPABASE_URL: 'http://project.supabase.co' }), /HTTPS in production/);
  assert.deepEqual(getRuntimeEnvironment({ ...base, FRONTEND_ORIGIN: 'https://app.example.com,https://preview.example.com' }).allowedOrigins, ['https://app.example.com', 'https://preview.example.com']);
});

test('CORS entries must be exact origins without a path', () => {
  assert.throws(() => getRuntimeEnvironment({ NODE_ENV: 'development', SUPABASE_URL: 'http://localhost:54321', SUPABASE_SERVICE_ROLE_KEY: 'local-key', FRONTEND_ORIGIN: 'https://app.example.com/dashboard' }), /without paths/);
});
