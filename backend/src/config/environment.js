import 'dotenv/config';

const isHttpUrl = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
};

export function getRuntimeEnvironment(env = process.env) {
  const testMode = env.NODE_ENV === 'test';
  const missing = [];
  if (!testMode && !isHttpUrl(env.SUPABASE_URL || '')) missing.push('SUPABASE_URL (must be an HTTP(S) URL)');
  if (!testMode && !env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (env.NODE_ENV === 'production' && !env.FRONTEND_ORIGIN?.trim()) missing.push('FRONTEND_ORIGIN');
  if (missing.length) throw new Error(`Invalid backend environment: ${missing.join(', ')}`);

  if (env.NODE_ENV === 'production' && new URL(env.SUPABASE_URL).protocol !== 'https:') {
    throw new Error('Invalid backend environment: SUPABASE_URL must use HTTPS in production');
  }

  const configuredOrigins = (env.FRONTEND_ORIGIN || '')
    .split(',').map(value => value.trim()).filter(Boolean);
  const invalidOrigins = configuredOrigins.filter(value => {
    try { const parsed = new URL(value); return !['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value; }
    catch { return true; }
  });
  if (invalidOrigins.length) throw new Error('Invalid backend environment: FRONTEND_ORIGIN must contain comma-separated origins without paths');

  return {
    allowedOrigins: configuredOrigins.length ? configuredOrigins : ['http://localhost:5173'],
  };
}
