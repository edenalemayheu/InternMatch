/**
 * api.js — InternMatch data service layer.
 *
 * ALL data access from pages/components must go through this file.
 * Every function is async with ~300ms simulated latency.
 * Reads/writes exclusively through storage.js (getStore / updateStore).
 *
 * README rules enforced here, not just in the UI:
 *   - Phase gating
 *   - Role checks
 *   - contact_email returned only when shortlisted by that company
 *
 * To swap for a real backend: replace the body of each function with a
 * fetch() call — the signatures stay identical.
 */

import { getStore, updateStore, resetToSeed } from './storage.js';
import { runMatching } from '../lib/matching.js';
import { SEED } from './seed.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const DELAY = 300; // ms

const PHASE_ORDER = [
  'ranking_open', 'ranking_locked', 'shortlisting', 'shortlist_locked',
  'interviewing', 'company_ranking', 'company_locked', 'matched', 'revealed',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = () => new Promise(r => setTimeout(r, DELAY));

function phaseIndex(phase) {
  return PHASE_ORDER.indexOf(phase);
}

function apiError(message, code = 'API_ERROR') {
  const e = new Error(message);
  e.code  = code;
  return e;
}

function requireUser(store) {
  const user = store.users.find(u => u.id === store.currentUserId);
  if (!user) throw apiError('You must be logged in.', 'UNAUTHENTICATED');
  return user;
}

function requireRole(store, role) {
  const user = requireUser(store);
  // Admins bypass all role checks
  if (user.is_admin) return user;
  if (user.role !== role) {
    throw apiError(`This action requires the ${role} role.`, 'FORBIDDEN');
  }
  return user;
}

function requireAdmin(store) {
  const user = requireUser(store);
  if (!user.is_admin) throw apiError('Admin access required.', 'FORBIDDEN');
  return user;
}

function requirePhase(store, allowedPhases) {
  const phase = store.round.phase;
  if (!allowedPhases.includes(phase)) {
    throw apiError(
      `Action not allowed in phase "${phase}". Allowed: ${allowedPhases.join(', ')}.`,
      'PHASE_LOCKED'
    );
  }
}

/** Return student for a user_id, or throw */
function getStudentForUser(store, userId) {
  const s = store.students.find(s => s.user_id === userId);
  if (!s) throw apiError('Student profile not found.', 'NOT_FOUND');
  return s;
}

/** Return company for a user_id, or throw */
function getCompanyForUser(store, userId) {
  const c = store.companies.find(c => c.user_id === userId);
  if (!c) throw apiError('Company profile not found.', 'NOT_FOUND');
  return c;
}

/** Generate a simple sequential id */
let _idCounter = Date.now();
function newId(prefix = 'id') {
  return `${prefix}-${++_idCounter}`;
}

/** Add a notification to the store (call inside updateStore) */
function pushNotification(store, userId, message, type = 'info', meta = {}) {
  store.notifications.push({
    id: newId('n'),
    user_id: userId,
    message,
    type,
    read: false,
    created_at: new Date().toISOString(),
    meta,
  });
}

/** Strip contact_email from a student object for a given company context */
function maskStudentContact(student, postingId, store) {
  const sl = store.shortlists.find(
    s => s.student_id === student.id &&
         s.posting_id  === postingId &&
         s.shortlist_status === 'shortlisted'
  );
  if (sl) return student;
  const { contact_email: _omit, ...safe } = student;
  return { ...safe, contact_email: null };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  await delay();
  const store = getStore();
  if (!store.currentUserId) return null;
  const user = store.users.find(u => u.id === store.currentUserId);
  if (!user) return null;
  // Attach display name from student or company profile
  const student = store.students.find(s => s.user_id === user.id);
  const company = store.companies.find(c => c.user_id === user.id);
  // Admins with role:'admin' get no profile lookup needed
  return {
    ...user,
    name: student?.full_name ?? company?.company_name ?? user.email,
    hasProfile: user.is_admin || !!student || !!company,
  };
}

export async function login(email, password) {
  await delay();
  const store = getStore();
  const user  = store.users.find(u => u.email === email && u.password === password);
  if (!user) throw apiError('Invalid email or password.', 'AUTH_FAILED');
  updateStore(s => { s.currentUserId = user.id; return s; });
  const student = store.students.find(s => s.user_id === user.id);
  const company = store.companies.find(c => c.user_id === user.id);
  return {
    user: {
      ...user,
      name: student?.full_name ?? company?.company_name ?? user.email,
      hasProfile: user.is_admin || !!student || !!company,
    },
  };
}

export async function logout() {
  await delay();
  updateStore(s => { s.currentUserId = null; return s; });
}

export async function signup(email, password, role) {
  await delay();
  const store = getStore();
  if (store.users.find(u => u.email === email)) {
    throw apiError('An account with that email already exists.', 'EMAIL_TAKEN');
  }
  const user = {
    id:               newId('u'),
    email,
    password,
    role,
    is_admin:         false,
    profile_complete: false,
  };
  updateStore(s => { s.users.push(user); s.currentUserId = user.id; return s; });
  return { user: { ...user, name: email, hasProfile: false } };
}

export async function completeOnboarding(data) {
  await delay();
  const store = getStore();
  const user  = requireUser(store);

  if (user.role === 'student') {
    const existing = store.students.find(s => s.user_id === user.id);
    const profile = {
      id:           existing?.id ?? newId('s'),
      user_id:      user.id,
      full_name:    data.full_name,
      department:   data.department,
      year:         data.year,
      skills:       data.skills ?? [],
      projects:     data.projects ?? [],
      certificates: data.certificates ?? [],
      portfolio_url: data.portfolio_url ?? '',
      availability: data.availability ?? '',
      contact_email: user.email,
    };
    updateStore(s => {
      const idx = s.students.findIndex(x => x.user_id === user.id);
      if (idx >= 0) s.students[idx] = profile; else s.students.push(profile);
      const u = s.users.find(u => u.id === user.id);
      if (u) u.profile_complete = true;
      return s;
    });
    return { profile };
  }

  if (user.role === 'company') {
    const existing = store.companies.find(c => c.user_id === user.id);
    const profile = {
      id:             existing?.id ?? newId('c'),
      user_id:        user.id,
      company_name:   data.company_name,
      industry:       data.industry ?? '',
      contact_person: data.contact_person ?? '',
      logo_url:       data.logo_url ?? '',
    };
    updateStore(s => {
      const idx = s.companies.findIndex(x => x.user_id === user.id);
      if (idx >= 0) s.companies[idx] = profile; else s.companies.push(profile);
      const u = s.users.find(u => u.id === user.id);
      if (u) u.profile_complete = true;
      return s;
    });
    return { profile };
  }

  throw apiError('Unknown role for onboarding.', 'INVALID_ROLE');
}

// ── Round ─────────────────────────────────────────────────────────────────────

export async function getRound() {
  await delay();
  return { round: getStore().round };
}

export async function advancePhase() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  const idx  = phaseIndex(store.round.phase);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) {
    throw apiError('Round is already at the final phase.', 'PHASE_LIMIT');
  }
  const nextPhase = PHASE_ORDER[idx + 1];
  let updated;
  updateStore(s => {
    s.round.phase = nextPhase;
    // Side effects on phase transitions
    if (nextPhase === 'revealed') {
      // Notify every matched student and company
      for (const match of s.matches) {
        const student = s.students.find(st => st.id === match.student_id);
        const posting = s.postings.find(p => p.id === match.posting_id);
        const company = s.companies.find(c => c.id === posting?.company_id);
        if (student) pushNotification(s, student.user_id,
          `Match Day! You've been matched with ${company?.company_name} for ${posting?.title}.`,
          'success', { match_id: match.id, posting_id: match.posting_id });
      }
    }
    updated = s.round;
    return s;
  });
  return { round: updated };
}

export async function resetRound() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  updateStore(s => {
    s.round.phase    = 'ranking_open';
    s.studentRankings  = [];
    s.companyRankings  = [];
    s.shortlists       = [];
    s.matches          = [];
    s.notifications    = [];
    return s;
  });
  return { round: getStore().round };
}

// ── Postings ──────────────────────────────────────────────────────────────────

export async function getPostings({ showAll = false } = {}) {
  await delay();
  const store   = getStore();
  const user    = requireUser(store);
  const roundId = store.round.id;
  const all     = store.postings.filter(p => p.round_id === roundId);

  if (showAll || user.role !== 'student') return { postings: all };

  const student = store.students.find(s => s.user_id === user.id);
  if (!student) return { postings: all };

  const filtered = all.filter(p =>
    (!p.required_department || p.required_department === student.department) ||
    (p.required_skills ?? []).some(sk => student.skills.includes(sk))
  );
  return { postings: filtered.length ? filtered : all };
}

export async function getPosting(postingId) {
  await delay();
  const store   = getStore();
  requireUser(store);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting) throw apiError('Posting not found.', 'NOT_FOUND');
  return { posting };
}

export async function createPosting(data) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = {
    id:                   newId('p'),
    company_id:           company.id,
    round_id:             store.round.id,
    title:                data.title,
    description:          data.description ?? '',
    required_department:  data.required_department ?? '',
    required_skills:      data.required_skills ?? [],
    capacity:             data.capacity ?? 1,
  };
  updateStore(s => { s.postings.push(posting); return s; });
  return { posting };
}

export async function updatePosting(postingId, data) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting) throw apiError('Posting not found.', 'NOT_FOUND');
  if (posting.company_id !== company.id) throw apiError('You do not own this posting.', 'FORBIDDEN');
  updateStore(s => {
    const p = s.postings.find(x => x.id === postingId);
    Object.assign(p, data);
    return s;
  });
  return { posting: getStore().postings.find(p => p.id === postingId) };
}

// ── Student profile & ranking ─────────────────────────────────────────────────

export async function getStudentProfile(userId) {
  await delay();
  const store   = getStore();
  requireUser(store);
  const targetId = userId ?? store.currentUserId;
  const student  = store.students.find(s => s.user_id === targetId);
  if (!student) return { student: null };
  // Only the student themselves or admin gets contact_email
  const user = store.users.find(u => u.id === store.currentUserId);
  if (user?.id !== targetId && !user?.is_admin) {
    const { contact_email: _omit, ...safe } = student;
    return { student: { ...safe, contact_email: null } };
  }
  return { student };
}

export async function updateStudentProfile(data) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'student');
  const student = store.students.find(s => s.user_id === user.id);
  if (!student) throw apiError('Student profile not found.', 'NOT_FOUND');
  updateStore(s => {
    const st = s.students.find(x => x.user_id === user.id);
    Object.assign(st, data);
    return s;
  });
  return { student: getStore().students.find(s => s.user_id === user.id) };
}

export async function getMyRanking() {
  await delay();
  const store   = getStore();
  const user    = requireRole(store, 'student');
  const student = getStudentForUser(store, user.id);
  const ranking = store.studentRankings.find(
    r => r.student_id === student.id && r.round_id === store.round.id
  );
  return { ranking: ranking ?? null };
}

export async function saveMyRanking(orderedPostingIds) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'student');
  requirePhase(store, ['ranking_open']);
  const student = getStudentForUser(store, user.id);
  let ranking;
  updateStore(s => {
    const idx = s.studentRankings.findIndex(
      r => r.student_id === student.id && r.round_id === s.round.id
    );
    ranking = {
      id:                  idx >= 0 ? s.studentRankings[idx].id : newId('sr'),
      student_id:          student.id,
      round_id:            s.round.id,
      ordered_posting_ids: orderedPostingIds,
    };
    if (idx >= 0) s.studentRankings[idx] = ranking;
    else s.studentRankings.push(ranking);
    return s;
  });
  return { ranking };
}

// ── Company: applicants, shortlist, interviews, final ranking ─────────────────

export async function getCompanyPostings() {
  await delay();
  const store   = getStore();
  const user    = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  return { postings: store.postings.filter(p => p.company_id === company.id) };
}

export async function getCompanyProfile(userId) {
  await delay();
  const store    = getStore();
  requireUser(store);
  const targetId = userId ?? store.currentUserId;
  const company  = store.companies.find(c => c.user_id === targetId);
  return { company: company ?? null };
}

export async function upsertCompanyProfile(data) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const existing = store.companies.find(c => c.user_id === user.id);
  const profile = {
    id:             existing?.id ?? newId('c'),
    user_id:        user.id,
    company_name:   data.company_name,
    industry:       data.industry ?? '',
    contact_person: data.contact_person ?? '',
    logo_url:       data.logo_url ?? '',
  };
  updateStore(s => {
    const idx = s.companies.findIndex(c => c.user_id === user.id);
    if (idx >= 0) s.companies[idx] = profile; else s.companies.push(profile);
    return s;
  });
  return { company: profile };
}

export async function getApplicants(postingId) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting) throw apiError('Posting not found.', 'NOT_FOUND');
  if (posting.company_id !== company.id && !user.is_admin) {
    throw apiError('You do not own this posting.', 'FORBIDDEN');
  }
  requirePhase(store, [
    'ranking_locked','shortlisting','shortlist_locked',
    'interviewing','company_ranking','company_locked','matched','revealed',
  ]);

  // All students who ranked this posting
  const applicantIds = store.studentRankings
    .filter(r => r.round_id === store.round.id && r.ordered_posting_ids.includes(postingId))
    .map(r => r.student_id);

  const applicants = applicantIds.map(sid => {
    const student = store.students.find(s => s.id === sid);
    if (!student) return null;
    const sl = store.shortlists.find(s => s.student_id === sid && s.posting_id === postingId);
    const rank = store.studentRankings
      .find(r => r.student_id === sid && r.round_id === store.round.id)
      ?.ordered_posting_ids.indexOf(postingId) + 1 || null;
    // Mask contact_email unless shortlisted
    const masked = maskStudentContact(student, postingId, store);
    return { ...masked, shortlist_status: sl?.shortlist_status ?? 'pending', student_rank: rank };
  }).filter(Boolean);

  // Sort by student_rank ascending (best signal first)
  applicants.sort((a, b) => (a.student_rank ?? 999) - (b.student_rank ?? 999));
  return { applicants };
}

export async function shortlistStudent(postingId, studentId) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting || posting.company_id !== company.id) throw apiError('Posting not found or not owned.', 'FORBIDDEN');
  requirePhase(store, ['ranking_locked', 'shortlisting']);
  const student = store.students.find(s => s.id === studentId);
  if (!student) throw apiError('Student not found.', 'NOT_FOUND');

  let sl;
  updateStore(s => {
    const idx = s.shortlists.findIndex(x => x.posting_id === postingId && x.student_id === studentId);
    sl = {
      id:               idx >= 0 ? s.shortlists[idx].id : newId('sl'),
      posting_id:       postingId,
      student_id:       studentId,
      round_id:         s.round.id,
      shortlist_status: 'shortlisted',
      interview_status: null,
      notes:            idx >= 0 ? s.shortlists[idx].notes : '',
    };
    if (idx >= 0) s.shortlists[idx] = sl; else s.shortlists.push(sl);
    // Notify student
    pushNotification(s, student.user_id,
      `You've been shortlisted by ${company.company_name} for ${posting.title}.`,
      'info',
      { company_name: company.company_name, posting_title: posting.title,
        posting_id: postingId, contact_email: company.contact_person }
    );
    return s;
  });
  return { shortlist: sl };
}

export async function rejectStudent(postingId, studentId) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting || posting.company_id !== company.id) throw apiError('Posting not found or not owned.', 'FORBIDDEN');
  requirePhase(store, ['ranking_locked', 'shortlisting', 'shortlist_locked']);
  updateStore(s => {
    const idx = s.shortlists.findIndex(x => x.posting_id === postingId && x.student_id === studentId);
    if (idx >= 0) {
      s.shortlists[idx].shortlist_status = 'rejected';
    } else {
      s.shortlists.push({ id: newId('sl'), posting_id: postingId, student_id: studentId,
        round_id: s.round.id, shortlist_status: 'rejected', interview_status: null, notes: '' });
    }
    return s;
  });
  return { ok: true };
}

export async function getShortlist(postingId) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting || posting.company_id !== company.id) throw apiError('Not found.', 'NOT_FOUND');

  const items = store.shortlists
    .filter(sl => sl.posting_id === postingId && sl.shortlist_status === 'shortlisted')
    .map(sl => {
      const student = store.students.find(s => s.id === sl.student_id);
      return { ...sl, student: student ? maskStudentContact(student, postingId, store) : null };
    });
  return { shortlist: items };
}

export async function setInterviewStatus(postingId, studentId, status) {
  await delay();
  const store = getStore();
  requireRole(store, 'company');
  updateStore(s => {
    const sl = s.shortlists.find(x => x.posting_id === postingId && x.student_id === studentId);
    if (sl) sl.interview_status = status;
    return s;
  });
  return { ok: true };
}

export async function saveInterviewNotes(postingId, studentId, notes) {
  await delay();
  const store = getStore();
  requireRole(store, 'company');
  updateStore(s => {
    const sl = s.shortlists.find(x => x.posting_id === postingId && x.student_id === studentId);
    if (sl) sl.notes = notes;
    return s;
  });
  return { ok: true };
}

export async function saveCompanyRanking(postingId, data) {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const posting = store.postings.find(p => p.id === postingId);
  if (!posting || posting.company_id !== company.id) throw apiError('Not found or not owned.', 'FORBIDDEN');
  requirePhase(store, ['interviewing', 'company_ranking']);

  let cr;
  updateStore(s => {
    const idx = s.companyRankings.findIndex(x => x.posting_id === postingId && x.round_id === s.round.id);
    cr = {
      id:                 idx >= 0 ? s.companyRankings[idx].id : newId('cr'),
      posting_id:         postingId,
      round_id:           s.round.id,
      ordered_student_ids: data.ordered_student_ids ?? [],
      scores:              data.scores ?? {},
    };
    if (idx >= 0) s.companyRankings[idx] = cr; else s.companyRankings.push(cr);
    return s;
  });
  return { ranking: cr };
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications() {
  await delay();
  const store = getStore();
  const user  = requireUser(store);
  const notes = store.notifications
    .filter(n => n.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  // Strip contact_email from notifications unless phase >= shortlist_locked
  const phaseIdx = phaseIndex(store.round.phase);
  const revealContact = phaseIdx >= phaseIndex('shortlist_locked');
  return {
    notifications: notes.map(n => {
      if (!revealContact && n.meta?.contact_email) {
        return { ...n, meta: { ...n.meta, contact_email: null } };
      }
      return n;
    }),
  };
}

export async function markNotificationRead(notificationId) {
  await delay();
  const store = getStore();
  requireUser(store);
  updateStore(s => {
    const n = s.notifications.find(x => x.id === notificationId);
    if (n) n.read = true;
    return s;
  });
  return { ok: true };
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function runMatchingNow() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  requirePhase(store, ['company_locked', 'matched']);

  const result = runMatching({
    students:        store.students,
    postings:        store.postings.filter(p => p.round_id === store.round.id),
    studentRankings: store.studentRankings.filter(r => r.round_id === store.round.id),
    companyRankings: store.companyRankings.filter(r => r.round_id === store.round.id),
  });

  updateStore(s => {
    s.matches = result.matches.map(m => {
      const student = s.students.find(st => st.id === m.student_id);
      return { ...m, id: newId('match'), round_id: s.round.id, student_name: student?.full_name ?? m.student_id };
    });
    s.round.phase = 'matched';
    return s;
  });

  return result;
}

// Keep RoundContext.runMatching() working (alias)
export { runMatchingNow as runMatching };

export async function getMatchResults() {
  await delay();
  const store = getStore();
  const user  = requireUser(store);
  const phase = store.round.phase;

  // Admin sees everything anytime
  if (user.is_admin) {
    return { matches: store.matches, phase };
  }

  // Students and companies only see results in 'revealed'
  if (phase !== 'revealed') {
    throw apiError('Match results are not yet revealed.', 'PHASE_LOCKED');
  }

  if (user.role === 'student') {
    const student = store.students.find(s => s.user_id === user.id);
    const match   = student ? store.matches.find(m => m.student_id === student.id) : null;
    return { match: match ?? null, phase };
  }

  if (user.role === 'company') {
    const company  = getCompanyForUser(store, user.id);
    const postings = store.postings.filter(p => p.company_id === company.id);
    const matches  = store.matches.filter(m => postings.some(p => p.id === m.posting_id));
    return { matches, phase };
  }

  return { matches: [], phase };
}

export async function getAllData() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  return {
    students:        store.students,
    companies:       store.companies,
    postings:        store.postings,
    round:           store.round,
    studentRankings: store.studentRankings,
    companyRankings: store.companyRankings,
    shortlists:      store.shortlists,
    matches:         store.matches,
    notifications:   store.notifications,
  };
}

export async function autoFillRankings() {
  await delay();
  const store = getStore();
  requireAdmin(store);

  updateStore(s => {
    // Apply the designed seed rankings (from seed.js SEED_STUDENT_RANKINGS / SEED_COMPANY_RANKINGS)
    // but only for students/companies that don't already have a ranking.
    for (const sr of SEED.studentRankings) {
      const exists = s.studentRankings.find(
        r => r.student_id === sr.student_id && r.round_id === s.round.id
      );
      if (!exists) s.studentRankings.push({ ...sr, round_id: s.round.id });
    }
    for (const cr of SEED.companyRankings) {
      const exists = s.companyRankings.find(
        r => r.posting_id === cr.posting_id && r.round_id === s.round.id
      );
      if (!exists) s.companyRankings.push({ ...cr, round_id: s.round.id });
    }
    // NOTE: shortlists are NOT auto-filled here. Companies must shortlist
    // students manually (or via the admin panel) — this keeps the
    // contact_email gating correct. Phase is advanced to company_locked
    // so runMatchingNow can be called immediately.
    s.round.phase = 'company_locked';
    return s;
  });

  return { ok: true, message: 'Rankings auto-filled. Phase advanced to company_locked.' };
}

export async function resetDemo() {
  await delay();
  resetToSeed();
  return { ok: true };
}

/** Emergency one-click: auto-fill → run matching → advance to revealed */
export async function autoFillAndReveal() {
  await delay();
  const store = getStore();
  requireAdmin(store);

  // 1. Fill rankings (same as autoFillRankings but inline)
  updateStore(s => {
    for (const sr of SEED.studentRankings) {
      const exists = s.studentRankings.find(r => r.student_id === sr.student_id && r.round_id === s.round.id);
      if (!exists) s.studentRankings.push({ ...sr, round_id: s.round.id });
    }
    for (const cr of SEED.companyRankings) {
      const exists = s.companyRankings.find(r => r.posting_id === cr.posting_id && r.round_id === s.round.id);
      if (!exists) s.companyRankings.push({ ...cr, round_id: s.round.id });
    }
    s.round.phase = 'company_locked';
    return s;
  });

  // 2. Run matching
  const s2 = getStore();
  const result = runMatching({
    students:        s2.students,
    postings:        s2.postings.filter(p => p.round_id === s2.round.id),
    studentRankings: s2.studentRankings.filter(r => r.round_id === s2.round.id),
    companyRankings: s2.companyRankings.filter(r => r.round_id === s2.round.id),
  });

  updateStore(s => {
    s.matches = result.matches.map(m => {
      const student = s.students.find(st => st.id === m.student_id);
      return { ...m, id: newId('match'), round_id: s.round.id, student_name: student?.full_name ?? m.student_id };
    });
    s.round.phase = 'matched';
    return s;
  });

  // 3. Advance to revealed (with notifications)
  updateStore(s => {
    s.round.phase = 'revealed';
    for (const match of s.matches) {
      const student = s.students.find(st => st.id === match.student_id);
      const posting = s.postings.find(p => p.id === match.posting_id);
      const company = s.companies.find(c => c.id === posting?.company_id);
      if (student) pushNotification(s, student.user_id,
        `Match Day! You've been matched with ${company?.company_name} for ${posting?.title}.`,
        'success', { match_id: match.id, posting_id: match.posting_id });
    }
    return s;
  });

  return { ok: true, matchCount: result.matches.length, unmatchedStudents: result.unmatchedStudents.length };
}

/** Get all shortlist entries for current company (all postings) */
export async function getMyShortlists() {
  await delay();
  const store = getStore();
  const user  = requireRole(store, 'company');
  const company = getCompanyForUser(store, user.id);
  const postings = store.postings.filter(p => p.company_id === company.id);
  const postingIds = new Set(postings.map(p => p.id));

  const items = store.shortlists
    .filter(sl => postingIds.has(sl.posting_id))
    .map(sl => {
      const student = store.students.find(s => s.id === sl.student_id);
      const posting = store.postings.find(p => p.id === sl.posting_id);
      // Shortlisted students always get their email shown to this company
      return { ...sl, student: student ?? null, posting: posting ?? null };
    });
  return { shortlists: items };
}

// ── Convenience re-exports used by older stubs ────────────────────────────────

export async function upsertStudentProfile(data) {
  return updateStudentProfile(data);
}

export async function submitRanking(studentId, orderedPostingIds) {
  return saveMyRanking(orderedPostingIds);
}

export async function updateShortlist(postingId, studentId, status) {
  if (status === 'shortlisted') return shortlistStudent(postingId, studentId);
  if (status === 'rejected')    return rejectStudent(postingId, studentId);
  return { ok: true };
}

export async function submitCompanyRanking(postingId, data) {
  return saveCompanyRanking(postingId, data);
}

export async function getStudentRanking(studentId) {
  return getMyRanking();
}

export async function getAllStudents() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  return { students: store.students };
}

export async function getAllPostings() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  return { postings: store.postings };
}

export async function getAllRankings() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  return { studentRankings: store.studentRankings, companyRankings: store.companyRankings };
}

export async function getAllShortlists() {
  await delay();
  const store = getStore();
  requireAdmin(store);
  return { shortlists: store.shortlists };
}

export async function getMyMatch(userId) {
  try {
    return await getMatchResults();
  } catch {
    return null;
  }
}
