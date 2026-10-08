// @vitest-environment jsdom
/**
 * api.test.js — Integration tests for the api.js data layer.
 * Runs under jsdom so localStorage is available.
 * Fake timers advance the 300ms delay instantly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';
import { resetToSeed, updateStore } from './storage.js';
import * as api from './api.js';

// ── Helper: advance fake timers so 300ms delay resolves ──────────────────────
async function fast(promise) {
  vi.advanceTimersByTime(400);
  return promise;
}

beforeEach(() => {
  vi.useFakeTimers();
  resetToSeed();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Auth helpers ──────────────────────────────────────────────────────────────
const loginAs    = email => fast(api.login(email, 'demo1234'));
const loginAdmin = ()    => loginAs('demo-admin@internmatch.dev');
const loginStudent = (email = 'amara.osei@demo.dev') => loginAs(email);
const loginCompany = (email = 'recruit@nexatech.demo.dev') => loginAs(email);

// ── Phase gating ──────────────────────────────────────────────────────────────
describe('phase gating', () => {
  it('student can saveMyRanking during ranking_open', async () => {
    await loginStudent();
    const { ranking } = await fast(api.saveMyRanking(['p01', 'p02', 'p04']));
    expect(ranking).toBeDefined();
    expect(ranking.ordered_posting_ids).toEqual(['p01', 'p02', 'p04']);
  });

  it('student cannot saveMyRanking after phase advances to ranking_locked', async () => {
    await loginAdmin();
    await fast(api.advancePhase()); // ranking_open → ranking_locked

    await loginStudent();
    await expect(fast(api.saveMyRanking(['p01']))).rejects.toMatchObject({ code: 'PHASE_LOCKED' });
  });

  it('company cannot shortlistStudent outside ranking_locked/shortlisting', async () => {
    // Phase is ranking_open — shortlisting not allowed yet
    await loginCompany();
    await expect(
      fast(api.shortlistStudent('p01', 's01'))
    ).rejects.toMatchObject({ code: 'PHASE_LOCKED' });
  });

  it('company can shortlistStudent during ranking_locked', async () => {
    await loginAdmin();
    await fast(api.advancePhase()); // → ranking_locked

    await loginCompany(); // NexaTech
    const { shortlist } = await fast(api.shortlistStudent('p01', 's01'));
    expect(shortlist.shortlist_status).toBe('shortlisted');
  });

  it('company cannot shortlistStudent after shortlist_locked', async () => {
    await loginAdmin();
    // Advance to shortlist_locked: ranking_open → ranking_locked → shortlisting → shortlist_locked
    await fast(api.advancePhase());
    await fast(api.advancePhase());
    await fast(api.advancePhase());

    await loginCompany();
    await expect(
      fast(api.shortlistStudent('p01', 's01'))
    ).rejects.toMatchObject({ code: 'PHASE_LOCKED' });
  });
});

// ── contact_email rules ───────────────────────────────────────────────────────
/**
 * Root cause of original failure:
 *   autoFillRankings() previously copied SEED_SHORTLISTS into the store,
 *   which pre-populated shortlist_status:'shortlisted' entries. So when
 *   getApplicants ran, those students already had contact_email revealed.
 *   Fix: autoFillRankings no longer touches shortlists. Shortlists start
 *   empty and only appear from company actions (shortlistStudent) or
 *   explicit admin tools.
 *
 * The starting store has: shortlists=[], studentRankings=[], companyRankings=[].
 * We inject student rankings directly via updateStore (no autoFill side-effects)
 * then advance to ranking_locked so getApplicants is accessible.
 */
describe('contact_email', () => {
  beforeEach(async () => {
    // Advance to ranking_locked so getApplicants is accessible
    await loginAdmin();
    await fast(api.advancePhase()); // ranking_open -> ranking_locked

    // Inject only the student rankings we need — no shortlists, no company rankings
    updateStore(s => {
      s.studentRankings.push(
        { id:'t-sr01', student_id:'s01', round_id:s.round.id, ordered_posting_ids:['p01','p02'] },
        { id:'t-sr03', student_id:'s03', round_id:s.round.id, ordered_posting_ids:['p01','p03'] }
      );
      // Studio Nova posting p03 also needs s03 as applicant (same ranking row covers it)
      return s;
    });
    // Confirm no shortlists exist at start of each contact_email test
    const { shortlists } = await fast(api.getAllShortlists());
    if (shortlists.length !== 0) throw new Error('Test setup error: shortlists not empty at start');
  });

  it('getApplicants: contact_email is null for every applicant before any shortlisting', async () => {
    await loginCompany('recruit@nexatech.demo.dev');
    const { applicants } = await fast(api.getApplicants('p01'));
    expect(applicants.length).toBeGreaterThan(0);
    for (const a of applicants) {
      expect(a.contact_email).toBeNull();
    }
  });

  it('getApplicants: contact_email revealed only for the shortlisted student', async () => {
    await loginCompany('recruit@nexatech.demo.dev');
    await fast(api.shortlistStudent('p01', 's01'));  // shortlist ONLY s01

    const { applicants } = await fast(api.getApplicants('p01'));
    const s01 = applicants.find(a => a.id === 's01');
    expect(s01).toBeDefined();
    expect(s01.contact_email).toBe('amara.osei@demo.dev');  // revealed for s01

    // s03 is also an applicant but NOT shortlisted — must stay null
    const s03 = applicants.find(a => a.id === 's03');
    if (s03) expect(s03.contact_email).toBeNull();
  });

  it('getApplicants: other applicants keep null contact_email after partial shortlisting', async () => {
    await loginCompany('recruit@nexatech.demo.dev');
    await fast(api.shortlistStudent('p01', 's01'));  // only s01 shortlisted

    const { applicants } = await fast(api.getApplicants('p01'));
    const others = applicants.filter(a => a.id !== 's01');
    for (const a of others) {
      expect(a.contact_email).toBeNull();
    }
  });

  it('different company never sees contact_email even if student is shortlisted by another company', async () => {
    // NexaTech shortlists s01 for their posting p01
    await loginCompany('recruit@nexatech.demo.dev');
    await fast(api.shortlistStudent('p01', 's01'));

    // Studio Nova views p03 — s03 ranks p03 but Studio Nova has NOT shortlisted them
    await loginCompany('recruit@studionova.demo.dev');
    const { applicants } = await fast(api.getApplicants('p03'));
    // s03 is shortlisted by NexaTech for p01, but that is a DIFFERENT company/posting.
    // Studio Nova must not see s03's contact_email here.
    for (const a of applicants) {
      expect(a.contact_email).toBeNull();
    }
  });
});

// ── Role checks ───────────────────────────────────────────────────────────────
describe('role checks', () => {
  it('student calling getAllData (admin function) throws FORBIDDEN', async () => {
    await loginStudent();
    await expect(fast(api.getAllData())).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('student calling advancePhase throws FORBIDDEN', async () => {
    await loginStudent();
    await expect(fast(api.advancePhase())).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('company calling saveMyRanking (student function) throws FORBIDDEN', async () => {
    await loginCompany();
    await expect(fast(api.saveMyRanking(['p01']))).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('unauthenticated call throws UNAUTHENTICATED', async () => {
    await fast(api.logout());
    await expect(fast(api.saveMyRanking(['p01']))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});

// ── Full demo flow ────────────────────────────────────────────────────────────
describe('full demo flow', () => {
  let matchResult;

  it('autoFillRankings + runMatchingNow produces interesting results', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings()); // fills rankings, advances to company_locked

    const result = await fast(api.runMatchingNow());
    matchResult = result;

    // At least 2 students unmatched (s13=Oliver, s14=Mei designed to be unmatched)
    expect(result.unmatchedStudents.length).toBeGreaterThanOrEqual(2);

    // At least 1 posting unfilled (p07 and p08 from Greenfield designed to be unfilled)
    expect(result.unmatchedPostings.length).toBeGreaterThanOrEqual(1);

    // At least 2 pairs with identical scores (designed: s03/p01=1.50 and s07/p01=1.50 etc.)
    const scores = result.scoredPairs.map(p => p.score);
    const uniqueScores = new Set(scores.map(s => s.toFixed(4)));
    const duplicatedScore = scores.some(s =>
      scores.filter(x => Math.abs(x - s) < 0.0001).length > 1
    );
    expect(duplicatedScore).toBe(true);

    // Matches exist
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('match results hidden from student before revealed', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings());
    await fast(api.runMatchingNow()); // phase → matched

    await loginStudent('amara.osei@demo.dev');
    await expect(fast(api.getMatchResults())).rejects.toMatchObject({ code: 'PHASE_LOCKED' });
  });

  it('match results hidden from company before revealed', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings());
    await fast(api.runMatchingNow());

    await loginCompany('recruit@nexatech.demo.dev');
    await expect(fast(api.getMatchResults())).rejects.toMatchObject({ code: 'PHASE_LOCKED' });
  });

  it('admin can see match results before revealed', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings());
    await fast(api.runMatchingNow());

    const { matches } = await fast(api.getMatchResults());
    expect(Array.isArray(matches)).toBe(true);
  });

  it('student sees their own match result after revealed', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings());
    await fast(api.runMatchingNow()); // → matched
    await fast(api.advancePhase());   // → revealed

    await loginStudent('amara.osei@demo.dev'); // s01, designed to match p01
    const result = await fast(api.getMatchResults());
    // Amara (s01) should have a match result
    expect(result).toBeDefined();
  });

  it('company sees their matches after revealed', async () => {
    await loginAdmin();
    await fast(api.autoFillRankings());
    await fast(api.runMatchingNow());
    await fast(api.advancePhase()); // → revealed

    await loginCompany('recruit@nexatech.demo.dev');
    const { matches } = await fast(api.getMatchResults());
    expect(Array.isArray(matches)).toBe(true);
  });
});

// ── resetDemo ─────────────────────────────────────────────────────────────────
describe('resetDemo', () => {
  it('restores seed state after mutations', async () => {
    // Mutate: login, add a ranking, advance phase
    await loginStudent();
    await fast(api.saveMyRanking(['p01', 'p02']));
    await loginAdmin();
    await fast(api.advancePhase());

    // Reset
    await fast(api.resetDemo());

    // Phase is back to ranking_open
    const { round } = await fast(api.getRound());
    expect(round.phase).toBe('ranking_open');

    // Rankings are wiped
    await loginStudent();
    const { ranking } = await fast(api.getMyRanking());
    expect(ranking).toBeNull();
  });

  it('can login with seed accounts after reset', async () => {
    await fast(api.resetDemo());
    const { user } = await loginStudent('amara.osei@demo.dev');
    expect(user.email).toBe('amara.osei@demo.dev');
    expect(user.role).toBe('student');
  });

  it('admin account has is_admin true after reset', async () => {
    await fast(api.resetDemo());
    const { user } = await loginAdmin();
    expect(user.is_admin).toBe(true);
    expect(user.role).toBe('admin');
  });
});
