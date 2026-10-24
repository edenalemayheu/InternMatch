// @vitest-environment jsdom
// Demo (mock) mode must behave like the real contract in docs/api/endpoints.md,
// so what the pages learn from the mock is also true against the real backend.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

async function load() {
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', 'true');
  return import('./apiClient.js');
}
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => vi.unstubAllEnvs());

describe('mock mode follows the contract', () => {
  it('getCurrentUser returns { user }', async () => {
    const api = await load();
    expect(await api.getCurrentUser()).toEqual({ user: null });
    await api.login('student1@internmatch.demo', 'Student123!');
    const { user } = await api.getCurrentUser();
    expect(user).toMatchObject({ email: 'student1@internmatch.demo', role: 'student' });
  });

  it('signup accepts only student or company, and duplicate emails are 409', async () => {
    const api = await load();
    await expect(api.signup('x@y.co', 'password1', 'admin')).rejects.toMatchObject({ status: 400 });
    await expect(api.signup('student1@internmatch.demo', 'password1', 'student')).rejects.toMatchObject({ status: 409 });
  });

  it('every posting carries company_name', async () => {
    const api = await load();
    await api.login('student1@internmatch.demo', 'Student123!');
    const { postings, allPostings } = await api.getPostings();
    expect(allPostings.length).toBeGreaterThan(0);
    for (const p of [...postings, ...allPostings]) expect(p.company_name).toBeTruthy();
  });

  it('getPostings({ all: true }) puts EVERY posting in `postings` (the Rank page relies on it)', async () => {
    const api = await load();
    await api.login('student1@internmatch.demo', 'Student123!');
    const res = await api.getPostings({ all: true });
    expect(res.postings.map((p) => p.id).sort()).toEqual(res.allPostings.map((p) => p.id).sort());
  });

  it('company postings include company_name, and created postings ignore client-set ids', async () => {
    const api = await load();
    await api.login('company1@internmatch.demo', 'Company123!');
    const { posting } = await api.createPosting({
      title: 'Data intern', required_department: '', required_skills: ['sql'], capacity: 2,
      id: 'hacked', company_id: 'someone-else', round_id: 'other',
    });
    expect(posting.id).not.toBe('hacked');
    expect(posting.company_id).not.toBe('someone-else');
    expect(posting.company_name).toBeTruthy();
    const { postings } = await api.getMyPostings();
    expect(postings.every((p) => p.company_name)).toBe(true);
  });

  it('a new student profile gets contact_email from the account, never from the request', async () => {
    const api = await load();
    await api.signup('fresh@student.test', 'password1', 'student');
    const { student } = await api.createStudent({
      full_name: 'Fresh S', department: 'Business', year: '2nd year', skills: ['excel'],
      portfolio_url: null, availability: 'Flexible', contact_email: 'someone-else@evil.test', id: 'hacked',
    });
    expect(student.contact_email).toBe('fresh@student.test');
    expect(student.id).not.toBe('hacked');
    const me = await api.getMyStudentProfile();
    expect(me.student.contact_email).toBe('fresh@student.test');
  });
});
