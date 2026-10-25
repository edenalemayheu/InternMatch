// @vitest-environment jsdom
// The rules from docs/api/endpoints.md, checked against the demo (mock) API:
// ownership (404), phase (403), validation (400) and what companies may see.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const S1 = ['student1@internmatch.demo', 'Student123!'];
const C1 = ['company1@internmatch.demo', 'Company123!']; // owns p-1, p-2
const C2 = ['company2@internmatch.demo', 'Company123!']; // owns p-3, p-4
const ADMIN = ['admin@internmatch.demo', 'Admin123!'];

let api;
const as = (who) => api.login(...who);
const advance = async (n) => { await as(ADMIN); for (let i = 0; i < n; i++) await api.advancePhase(); };
const reject = (p, status) => expect(p).rejects.toMatchObject({ status });

beforeEach(async () => {
  localStorage.clear(); sessionStorage.clear();
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', 'true');
  api = await import('./apiClient.js');
});
afterEach(() => vi.unstubAllEnvs());

describe('ownership: a company cannot touch another company\'s posting (404, nothing changes)', () => {
  it('reads, shortlists, rankings, notes, edits and deletes all return 404', async () => {
    await api.loadPreset('mid');          // phase: shortlisting
    await advance(2);                     // shortlist_locked, then interviewing
    await as(C2);                         // company 2 attacks company 1's posting p-1
    await reject(api.getApplicants('p-1'), 404);
    await reject(api.getShortlistedStudents('p-1'), 404);
    await reject(api.updateShortlist('p-1', 's-1', 'rejected'), 404);
    await reject(api.submitCompanyRanking('p-1', { ordered_student_ids: ['s-1'] }), 404);
    await reject(api.saveInterviewNotes('p-1', 's-1', 'hello'), 404);
    await reject(api.updatePosting('p-1', { title: 'hijacked' }), 404);
    await reject(api.deletePosting('p-1'), 404);

    await as(C1);                         // the owner still sees everything intact
    const { students } = await api.getShortlistedStudents('p-1');
    expect(students.map(s => s.id).sort()).toEqual(['s-1', 's-5']);
    expect(students.every(s => s.notes === '')).toBe(true);
    const { postings } = await api.getMyPostings();
    expect(postings.find(p => p.id === 'p-1').title).toBe('Frontend Engineer Intern');
  });

  it('students cannot call company endpoints (403)', async () => {
    await api.loadPreset('mid');
    await as(S1);
    await reject(api.getApplicants('p-1'), 403);
    await reject(api.updateShortlist('p-1', 's-1', 'rejected'), 403);
    await reject(api.createPosting({ title: 'x', capacity: 1 }), 403);
  });
});

describe('postings: only while ranking is open, only the allowed fields', () => {
  it('create, edit and delete are refused after ranking closes, with currentPhase', async () => {
    await api.loadPreset('mid');
    await as(C1);
    for (const call of [
      () => api.createPosting({ title: 'Late posting', required_department: '', required_skills: [], capacity: 1 }),
      () => api.updatePosting('p-1', { title: 'Changed' }),
      () => api.deletePosting('p-1'),
    ]) {
      const err = await call().catch(e => e);
      expect(err.status).toBe(403);
      expect(err.data.currentPhase).toBe('shortlisting');
    }
  });

  it('ignores id, company_id and round_id sent by the client, and validates', async () => {
    await api.loadPreset('fresh');
    await as(C1);
    await api.updatePosting('p-1', { title: '  New title  ', company_id: 'co-2', id: 'x', round_id: 'other' });
    const { postings } = await api.getMyPostings();
    const p1 = postings.find(p => p.id === 'p-1');
    expect(p1).toMatchObject({ title: 'New title', company_id: 'co-1' });
    expect(postings.find(p => p.id === 'x')).toBeUndefined();

    const bad = await api.updatePosting('p-1', { capacity: 11 }).catch(e => e);
    expect(bad.status).toBe(400);
    expect(bad.data.fields.capacity).toBeTruthy();
    const bad2 = await api.createPosting({ title: '', required_department: '', required_skills: [], capacity: 2 }).catch(e => e);
    expect(bad2.data.fields.title).toBeTruthy();
  });

  it('deleting a posting removes it from every student ranking', async () => {
    await api.loadPreset('fresh');
    await as(S1);
    await api.saveRanking(['p-1', 'p-2']);
    await as(C1);
    await api.deletePosting('p-1');
    await as(S1);
    expect((await api.getMyRanking()).ranking.ordered_posting_ids).toEqual(['p-2']);
  });
});

describe('student rankings are validated', () => {
  it('rejects duplicates and unknown postings, accepts a valid list', async () => {
    await api.loadPreset('fresh');
    await as(S1);
    await reject(api.saveRanking(['p-1', 'p-1']), 400);
    await reject(api.saveRanking(['p-1', 'does-not-exist']), 400);
    await expect(api.saveRanking(['p-2', 'p-1'])).resolves.toEqual({ ok: true });
  });
});

describe('what a company may see about a student', () => {
  const ALLOWED = ['id', 'full_name', 'department', 'year', 'skills', 'portfolio_url', 'availability'];

  it('applicants: only whitelisted fields; contact_email only for shortlisted students and only from shortlist_locked', async () => {
    await api.loadPreset('mid');                         // shortlisting
    await as(C1);
    let { applicants } = await api.getApplicants('p-1');
    expect(applicants.length).toBeGreaterThan(0);
    for (const a of applicants) {
      expect(Object.keys(a).sort()).toEqual([...ALLOWED, 'rank_position', 'shortlist_status'].sort()); // no user_id, no created_at, no email yet
    }
    expect(applicants.find(a => a.id === 's-1').shortlist_status).toBe('shortlisted');

    await advance(1);                                    // shortlist_locked
    await as(C1);
    ({ applicants } = await api.getApplicants('p-1'));
    for (const a of applicants) {
      if (a.shortlist_status === 'shortlisted') expect(a.contact_email).toBeTruthy();
      else expect('contact_email' in a).toBe(false);     // absent, not blank
    }
  });

  it('shortlisted: whitelisted fields, notes included, email only once contact opens', async () => {
    await api.loadPreset('mid');
    await as(C1);
    let { students } = await api.getShortlistedStudents('p-1');
    for (const s of students) {
      expect(Object.keys(s).sort()).toEqual([...ALLOWED, 'shortlist_id', 'notes'].sort());
    }
    await advance(1);
    await as(C1);
    ({ students } = await api.getShortlistedStudents('p-1'));
    expect(students.every(s => s.contact_email)).toBe(true);
  });

  it('shortlisting a student who did not rank the posting is refused', async () => {
    await api.loadPreset('mid');
    await as(C1);
    await reject(api.updateShortlist('p-1', 's-9', 'shortlisted'), 404);
    await reject(api.updateShortlist('p-1', 's-1', 'maybe'), 400);
  });
});

describe('company ranking: an order or scores, never both', () => {
  beforeEach(async () => { await api.loadPreset('mid'); await advance(2); await as(C1); }); // interviewing

  it('rejects both, neither, non-shortlisted students and bad scores', async () => {
    await reject(api.submitCompanyRanking('p-1', { ordered_student_ids: ['s-1'], scores: { 's-1': 5 } }), 400);
    await reject(api.submitCompanyRanking('p-1', {}), 400);
    await reject(api.submitCompanyRanking('p-1', { scores: null, ordered_student_ids: null }), 400);
    await reject(api.submitCompanyRanking('p-1', { ordered_student_ids: ['s-1', 's-16'] }), 400);  // s-16 was rejected
    await reject(api.submitCompanyRanking('p-1', { ordered_student_ids: ['s-1', 's-1'] }), 400);
    await reject(api.submitCompanyRanking('p-1', { scores: { 's-1': 11 } }), 400);
    await reject(api.submitCompanyRanking('p-1', { scores: { 's-1': 0 } }), 400);
    await reject(api.submitCompanyRanking('p-1', { scores: { 's-1': 7.5 } }), 400);
  });

  it('accepts an order, then replaces it with scores', async () => {
    await api.submitCompanyRanking('p-1', { ordered_student_ids: ['s-5', 's-1'] });
    let { companyRanking } = await api.getShortlistedStudents('p-1');
    expect(companyRanking.ordered_student_ids).toEqual(['s-5', 's-1']);
    expect(companyRanking.scores).toBeNull();

    await api.submitCompanyRanking('p-1', { scores: { 's-1': 9, 's-5': 7 } });
    ({ companyRanking } = await api.getShortlistedStudents('p-1'));
    expect(companyRanking.scores).toEqual({ 's-1': 9, 's-5': 7 });
    expect(companyRanking.ordered_student_ids).toBeNull();
  });

  it('is refused outside interviewing and company_ranking', async () => {
    await as(ADMIN); await api.resetRound();             // back to ranking_open
    await as(C1);
    const err = await api.submitCompanyRanking('p-1', { ordered_student_ids: [] }).catch(e => e);
    expect(err.status).toBe(403);
    expect(err.data.currentPhase).toBe('ranking_open');
  });
});

describe('interview notes', () => {
  it('are refused before interviewing, then save, read back, clear, and are limited to shortlisted students', async () => {
    await api.loadPreset('mid');                         // shortlisting: too early
    await as(C1);
    const early = await api.saveInterviewNotes('p-1', 's-1', 'too early').catch(e => e);
    expect(early.status).toBe(403);
    expect(early.data.currentPhase).toBe('shortlisting');

    await advance(2); await as(C1);                      // interviewing
    await api.saveInterviewNotes('p-1', 's-1', 'Strong on React. Follow up on the capstone.');
    let { students } = await api.getShortlistedStudents('p-1');
    expect(students.find(s => s.id === 's-1').notes).toBe('Strong on React. Follow up on the capstone.');
    expect(students.find(s => s.id === 's-5').notes).toBe('');

    await api.saveInterviewNotes('p-1', 's-1', '');      // empty text clears it
    ({ students } = await api.getShortlistedStudents('p-1'));
    expect(students.find(s => s.id === 's-1').notes).toBe('');

    await reject(api.saveInterviewNotes('p-1', 's-16', 'not shortlisted'), 404);
    const long = await api.saveInterviewNotes('p-1', 's-1', 'x'.repeat(2001)).catch(e => e);
    expect(long.status).toBe(400);
    expect(long.data.fields.notes).toBeTruthy();
  });

  it('are wiped by a round reset', async () => {
    await api.loadPreset('mid'); await advance(2); await as(C1);
    await api.saveInterviewNotes('p-1', 's-1', 'remember me');
    await as(ADMIN); await api.resetRound();
    const db = JSON.parse(localStorage.getItem('internmatch_mock_db'));
    expect(db.interviewNotes).toEqual([]);
  });
});

describe('results', () => {
  it('are refused before Match Day, with currentPhase', async () => {
    await api.loadPreset('mid');
    await as(S1);
    const err = await api.getMyMatches().catch(e => e);
    expect(err.status).toBe(403);
    expect(err.data.currentPhase).toBe('shortlisting');
  });

  it('contain only whitelisted fields once revealed', async () => {
    await api.loadPreset('matchday');
    await as(S1);
    const { match } = await api.getMyMatches();
    expect(Object.keys(match.company).sort()).toEqual(['company_name', 'contact_person', 'id', 'industry', 'logo_url'].sort());
    expect(Object.keys(match.posting).sort()).toEqual(['capacity', 'id', 'required_department', 'required_skills', 'title'].sort());
    expect(match).not.toHaveProperty('user_id');

    await as(C1);
    const { matches } = await api.getMyMatches();
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) {
      expect(m.student).not.toHaveProperty('user_id');
      expect(m.student).not.toHaveProperty('created_at');
      expect(m.student.contact_email).toBeTruthy();
      expect(Object.keys(m.posting).sort()).toEqual(['id', 'title']);
    }
  });
});

describe('company stats', () => {
  it('use the contract field names even for a company with no profile yet', async () => {
    await api.login('newcompany@internmatch.demo', 'Company123!');
    expect(await api.getCompanyStats()).toEqual({ postingsCount: 0, applicantsCount: 0, shortlistedCount: 0 });
  });
});
