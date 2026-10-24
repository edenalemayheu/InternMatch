// @vitest-environment jsdom
// Real-API mode: sessions, token refresh and error handling, against a fake fetch.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const json = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const USER = { id: 'u1', email: 'a@b.co', role: 'student', is_admin: false, hasProfile: true };
const SESSION = (n) => ({ token: `tok${n}`, refresh_token: `ref${n}`, expires_at: 9999999999, user: USER });

async function load() {
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubEnv('VITE_API_URL', 'http://api.test/api');
  return import('./apiClient.js');
}
const calls = () => globalThis.fetch.mock.calls.map(([url, init]) => ({ url: url.replace('http://api.test/api', ''), init }));
const bearer = (c) => c.init.headers.Authorization;

beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('login and session storage', () => {
  it('stores the session and sends the token on later requests', async () => {
    const api = await load();
    fetch.mockResolvedValueOnce(json(200, SESSION(1)));
    const { user } = await api.login('a@b.co', 'password1');
    expect(user).toEqual(USER);
    expect(JSON.parse(localStorage.getItem('internmatch.session')).token).toBe('tok1');

    fetch.mockResolvedValueOnce(json(200, { round: { id: 'r1' } }));
    await api.getCurrentRound();
    expect(bearer(calls()[1])).toBe('Bearer tok1');
  });

  it('a page reload keeps the user signed in (token is read back from storage)', async () => {
    let api = await load();
    fetch.mockResolvedValueOnce(json(200, SESSION(1)));
    await api.login('a@b.co', 'password1');

    api = await load(); // fresh module = fresh page load
    fetch.mockResolvedValueOnce(json(200, { user: USER }));
    const { user } = await api.getCurrentUser();
    expect(user).toEqual(USER);
    expect(bearer(calls()[1])).toBe('Bearer tok1');
    expect(calls()[1].url).toBe('/auth/me');
  });

  it('getCurrentUser makes no request when nobody is signed in', async () => {
    const api = await load();
    expect(await api.getCurrentUser()).toEqual({ user: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('a wrong password is a plain error: no refresh, no session expiry', async () => {
    const api = await load();
    const expired = vi.fn();
    api.onSessionExpired(expired);
    fetch.mockResolvedValueOnce(json(401, { error: 'Invalid email or password' }));
    await expect(api.login('a@b.co', 'bad')).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
  });

  it('logout clears the session even when the server cannot be reached', async () => {
    const api = await load();
    fetch.mockResolvedValueOnce(json(200, SESSION(1)));
    await api.login('a@b.co', 'password1');
    fetch.mockRejectedValueOnce(new TypeError('network down'));
    await expect(api.logout()).resolves.toEqual({ ok: true });
    expect(localStorage.getItem('internmatch.session')).toBeNull();
  });
});

describe('token refresh', () => {
  async function signedIn() {
    const api = await load();
    fetch.mockResolvedValueOnce(json(200, SESSION(1)));
    await api.login('a@b.co', 'password1');
    fetch.mockClear();
    return api;
  }

  it('on a 401 it refreshes once, rotates the tokens and retries the request', async () => {
    const api = await signedIn();
    fetch
      .mockResolvedValueOnce(json(401, { error: 'Invalid or expired session' }))   // original request
      .mockResolvedValueOnce(json(200, SESSION(2)))                                // POST /auth/refresh
      .mockResolvedValueOnce(json(200, { notifications: [] }));                    // retry
    const res = await api.getNotifications();
    expect(res).toEqual({ notifications: [] });
    const c = calls();
    expect(c[1].url).toBe('/auth/refresh');
    expect(JSON.parse(c[1].init.body)).toEqual({ refresh_token: 'ref1' });
    expect(bearer(c[2])).toBe('Bearer tok2');
    expect(JSON.parse(localStorage.getItem('internmatch.session')).refresh_token).toBe('ref2');
  });

  it('two requests failing at once share a single refresh', async () => {
    const api = await signedIn();
    fetch.mockImplementation(async (url, init) => {
      if (url.endsWith('/auth/refresh')) return json(200, SESSION(2));
      return init.headers.Authorization === 'Bearer tok1' ? json(401, { error: 'expired' }) : json(200, { notifications: [] });
    });
    await Promise.all([api.getNotifications(), api.getNotifications()]);
    expect(calls().filter((c) => c.url === '/auth/refresh')).toHaveLength(1);
  });

  it('if the refresh fails the session ends and the app is told', async () => {
    const api = await signedIn();
    const expired = vi.fn();
    api.onSessionExpired(expired);
    fetch
      .mockResolvedValueOnce(json(401, { error: 'expired' }))
      .mockResolvedValueOnce(json(401, { error: 'bad refresh token' }));
    await expect(api.getNotifications()).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('internmatch.session')).toBeNull();
  });
});

describe('error handling', () => {
  it('an HTML error page from a proxy becomes a readable error, not a JSON crash', async () => {
    const api = await load();
    fetch.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502 }));
    const err = await api.getCurrentRound().catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('The server had a problem. Try again in a moment.');
    expect(err.status).toBe(502);
  });

  it('an unreachable server gives a clear message', async () => {
    const api = await load();
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api.getCurrentRound()).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Cannot reach the server') });
  });

  it('keeps validation details so forms can show them', async () => {
    const api = await load();
    fetch.mockResolvedValueOnce(json(400, { error: 'Check the form', fields: { full_name: 'Required' } }));
    const err = await api.createStudent({}).catch((e) => e);
    expect(err.data.fields).toEqual({ full_name: 'Required' });
  });

  it('an empty success body is accepted', async () => {
    const api = await load();
    fetch.mockResolvedValueOnce(json(204));
    await expect(api.getCurrentRound()).resolves.toEqual({});
  });

  it('signup refuses any role except student and company before sending anything', async () => {
    const api = await load();
    await expect(api.signup('a@b.co', 'password1', 'admin')).rejects.toMatchObject({ status: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
