/**
 * apiClient.js — Single API surface for the entire frontend.
 *
 * When VITE_USE_MOCK=true: all functions use the local mock DB.
 * When VITE_USE_MOCK=false: all functions call the real /api with fetch.
 *
 * Components NEVER import mock files directly.
 * To connect to the real backend: set VITE_USE_MOCK=false in .env
 * and fill in the fetch stubs below (URL + method are already correct).
 */

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Simulated latency for mock (makes loading states visible) ─────────────────
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ── Auth token (real mode) ────────────────────────────────────────────────────
let _token = null;
export function setAuthToken(token) { _token = token; }
export function clearAuthToken()    { _token = null; }

async function apiFetch(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

// ── Mock imports (only evaluated when USE_MOCK=true, via dynamic structure) ───
// We use a lazy import pattern so mock code never ships to production.
let _mock = null;
async function getMock() {
  if (_mock) return _mock;
  const [{ getDb, updateDb, resetDb, newId, getSession, setSession, clearSession,
           PHASE_SEQUENCE, phaseIndex, phaseAtLeast, applyPhaseTransitionSideEffects, loadPreset },
         { runMatching }] =
    await Promise.all([import('./mock/mockDb.js'), import('./mock/mockMatching.js')]);
  _mock = { getDb, updateDb, resetDb, newId, getSession, setSession, clearSession,
            PHASE_SEQUENCE, phaseIndex, phaseAtLeast, applyPhaseTransitionSideEffects, loadPreset, runMatching };
  return _mock;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/auth/login */
export async function login(email, password) {
  if (!USE_MOCK) return apiFetch('POST', '/auth/login', { email, password });

  await delay();
  const { getDb, setSession } = await getMock();
  const db = getDb();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  const hasProfile = user.is_admin
    ? true
    : user.role === 'student'
    ? db.students.some(s => s.user_id === user.id)
    : db.companies.some(c => c.user_id === user.id);

  const sessionUser = { id: user.id, email: user.email, role: user.role, is_admin: user.is_admin, hasProfile };
  setSession(sessionUser);
  return { user: sessionUser };
}

/** POST /api/auth/signup */
export async function signup(email, password, role) {
  if (!USE_MOCK) return apiFetch('POST', '/auth/signup', { email, password, role });

  await delay();
  const { getDb, updateDb, newId, setSession } = await getMock();
  const db = getDb();
  if (db.users.find(u => u.email === email)) {
    throw Object.assign(new Error('An account with this email already exists.'), { status: 400 });
  }
  const userId = newId('u');
  updateDb(db => {
    db.users.push({ id: userId, email, password, role, is_admin: false, created_at: new Date().toISOString() });
    return db;
  });
  const sessionUser = { id: userId, email, role, is_admin: false, hasProfile: false };
  setSession(sessionUser);
  return { user: sessionUser };
}

/** Get current session */
export async function getCurrentUser() {
  if (!USE_MOCK) return apiFetch('GET', '/auth/me');

  await delay(50);
  const { getSession } = await getMock();
  return getSession();
}

/** Logout */
export async function logout() {
  if (!USE_MOCK) return apiFetch('POST', '/auth/logout');
  const { clearSession } = await getMock();
  clearSession();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUNDS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/rounds/current */
export async function getCurrentRound() {
  if (!USE_MOCK) return apiFetch('GET', '/rounds/current');

  await delay(50);
  const { getDb } = await getMock();
  return { round: getDb().round };
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/students — create profile */
export async function createStudent(data) {
  if (!USE_MOCK) return apiFetch('POST', '/students', data);

  await delay();
  const { getDb, updateDb, newId, getSession, setSession } = await getMock();
  const session = getSession();
  if (!session || session.role !== 'student') throw Object.assign(new Error('Forbidden'), { status: 403 });

  const studentId = newId('s');
  updateDb(db => {
    db.students.push({ id: studentId, user_id: session.id, ...data, created_at: new Date().toISOString() });
    const user = db.users.find(u => u.id === session.id);
    if (user) user.hasProfile = true;
    return db;
  });
  const updated = { ...session, hasProfile: true };
  setSession(updated);
  return { student: { id: studentId, user_id: session.id, ...data } };
}

/** GET /api/students/me */
export async function getMyStudentProfile() {
  if (!USE_MOCK) return apiFetch('GET', '/students/me');

  await delay(50);
  const { getDb, getSession } = await getMock();
  const session = getSession();
  const db = getDb();
  const student = db.students.find(s => s.user_id === session?.id);
  return { student: student || null };
}

/** PATCH /api/students/me */
export async function updateStudentProfile(data) {
  if (!USE_MOCK) return apiFetch('PATCH', '/students/me', data);

  await delay();
  const { updateDb, getSession } = await getMock();
  const session = getSession();
  updateDb(db => {
    const i = db.students.findIndex(s => s.user_id === session?.id);
    if (i >= 0) Object.assign(db.students[i], data);
    return db;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTINGS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/postings — student view (filtered or all) */
export async function getPostings({ all = false } = {}) {
  if (!USE_MOCK) return apiFetch('GET', `/postings${all ? '?all=true' : ''}`);

  await delay();
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  const postings = db.postings.filter(p => p.round_id === db.round.id);

  if (all || !session) return { postings };

  const student = db.students.find(s => s.user_id === session.id);
  if (!student) return { postings };

  const relevant = postings.filter(p =>
    (!p.required_department || p.required_department === student.department) ||
    (p.required_skills || []).some(sk => (student.skills || []).includes(sk))
  );
  return { postings: relevant.length > 0 ? relevant : postings, allPostings: postings };
}

/** GET /api/postings/mine — company view */
export async function getMyPostings() {
  if (!USE_MOCK) return apiFetch('GET', '/postings/mine');

  await delay();
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  const company = db.companies.find(c => c.user_id === session?.id);
  if (!company) return { postings: [] };
  const postings = db.postings.filter(p => p.company_id === company.id && p.round_id === db.round.id);
  return { postings };
}

/** POST /api/postings — create posting */
export async function createPosting(data) {
  if (!USE_MOCK) return apiFetch('POST', '/postings', data);

  await delay();
  const { getDb, updateDb, newId, getSession } = await getMock();
  const session = getSession();
  const db = getDb();
  const company = db.companies.find(c => c.user_id === session?.id);
  if (!company) throw Object.assign(new Error('Company profile not found'), { status: 403 });

  const id = newId('p');
  const posting = { id, company_id: company.id, round_id: db.round.id, ...data, created_at: new Date().toISOString() };
  updateDb(db => { db.postings.push(posting); return db; });
  return { posting };
}

/** PATCH /api/postings/:id — update posting */
export async function updatePosting(postingId, data) {
  if (!USE_MOCK) return apiFetch('PATCH', `/postings/${postingId}`, data);

  await delay();
  const { updateDb, getSession, getDb } = await getMock();
  const session = getSession();
  const db = getDb();
  const company = db.companies.find(c => c.user_id === session?.id);
  updateDb(db => {
    const i = db.postings.findIndex(p => p.id === postingId && p.company_id === company?.id);
    if (i >= 0) Object.assign(db.postings[i], data);
    return db;
  });
  return { ok: true };
}

/** DELETE /api/postings/:id */
export async function deletePosting(postingId) {
  if (!USE_MOCK) return apiFetch('DELETE', `/postings/${postingId}`);

  await delay();
  const { updateDb, getSession, getDb } = await getMock();
  const session = getSession();
  const db = getDb();
  const company = db.companies.find(c => c.user_id === session?.id);
  updateDb(db => {
    db.postings = db.postings.filter(p => !(p.id === postingId && p.company_id === company?.id));
    return db;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// RANKINGS (STUDENT)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/rankings — save student ranking */
export async function saveRanking(orderedPostingIds) {
  if (!USE_MOCK) return apiFetch('POST', '/rankings', { ordered_posting_ids: orderedPostingIds });

  await delay();
  const { getDb, updateDb, newId, getSession, phaseAtLeast } = await getMock();
  const db = getDb();
  if (db.round.phase !== 'ranking_open') {
    throw Object.assign(new Error('Action not allowed in current phase'), { status: 403, data: { currentPhase: db.round.phase } });
  }
  const session = getSession();
  const student = db.students.find(s => s.user_id === session?.id);
  if (!student) throw Object.assign(new Error('No student profile'), { status: 403 });

  updateDb(db => {
    const existing = db.studentRankings.findIndex(sr => sr.student_id === student.id && sr.round_id === db.round.id);
    if (existing >= 0) {
      db.studentRankings[existing].ordered_posting_ids = orderedPostingIds;
    } else {
      db.studentRankings.push({
        id: newId('sr'), student_id: student.id, round_id: db.round.id,
        ordered_posting_ids: orderedPostingIds, locked_at: null,
        created_at: new Date().toISOString(),
      });
    }
    return db;
  });
  return { ok: true };
}

/** GET /api/rankings/me */
export async function getMyRanking() {
  if (!USE_MOCK) return apiFetch('GET', '/rankings/me');

  await delay(50);
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  const student = db.students.find(s => s.user_id === session?.id);
  if (!student) return { ranking: null };
  const ranking = db.studentRankings.find(sr => sr.student_id === student.id && sr.round_id === db.round.id);
  return { ranking: ranking || null };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/companies — create company profile */
export async function createCompany(data) {
  if (!USE_MOCK) return apiFetch('POST', '/companies', data);

  await delay();
  const { updateDb, newId, getSession, setSession } = await getMock();
  const session = getSession();
  if (!session || session.role !== 'company') throw Object.assign(new Error('Forbidden'), { status: 403 });

  const companyId = newId('co');
  updateDb(db => {
    db.companies.push({ id: companyId, user_id: session.id, ...data, created_at: new Date().toISOString() });
    const user = db.users.find(u => u.id === session.id);
    if (user) user.hasProfile = true;
    return db;
  });
  const updated = { ...session, hasProfile: true };
  setSession(updated);
  return { company: { id: companyId, user_id: session.id, ...data } };
}

/** GET /api/companies/me */
export async function getMyCompanyProfile() {
  if (!USE_MOCK) return apiFetch('GET', '/companies/me');

  await delay(50);
  const { getDb, getSession } = await getMock();
  const session = getSession();
  const db = getDb();
  const company = db.companies.find(c => c.user_id === session?.id);
  return { company: company || null };
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICANTS & SHORTLISTS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/postings/:id/applicants */
export async function getApplicants(postingId) {
  if (!USE_MOCK) return apiFetch('GET', `/postings/${postingId}/applicants`);

  await delay();
  const { getDb, getSession, phaseAtLeast } = await getMock();
  const db = getDb();

  if (!phaseAtLeast(db.round.phase, 'ranking_locked')) {
    throw Object.assign(new Error('Action not allowed in current phase'), {
      status: 403, data: { currentPhase: db.round.phase },
    });
  }

  const session = getSession();
  const company = db.companies.find(c => c.user_id === session?.id);

  // Get all students who ranked this posting, with their rank position
  const applicants = [];
  for (const sr of db.studentRankings) {
    const rankPos = sr.ordered_posting_ids.indexOf(postingId);
    if (rankPos === -1) continue;

    const student = db.students.find(s => s.id === sr.student_id);
    if (!student) continue;

    const sl = db.shortlists.find(s => s.posting_id === postingId && s.student_id === student.id && s.round_id === db.round.id);
    const shortlist_status = sl?.shortlist_status || 'pending';

    // contact_email: only if shortlisted AND phase >= shortlist_locked, AND requesting company owns posting
    const posting = db.postings.find(p => p.id === postingId);
    const isOwnedByCompany = company && posting?.company_id === company.id;
    const revealContact = isOwnedByCompany &&
      shortlist_status === 'shortlisted' &&
      phaseAtLeast(db.round.phase, 'shortlist_locked');

    applicants.push({
      id: student.id,
      user_id: student.user_id,
      full_name: student.full_name,
      department: student.department,
      year: student.year,
      skills: student.skills,
      portfolio_url: student.portfolio_url,
      availability: student.availability,
      contact_email: revealContact ? student.contact_email : undefined, // absent if not revealed
      rank_position: rankPos + 1, // 1-based
      shortlist_status,
    });
  }

  // Sort by rank_position asc
  applicants.sort((a, b) => a.rank_position - b.rank_position);
  return { applicants };
}

/** PATCH /api/shortlists/:postingId/:studentId */
export async function updateShortlist(postingId, studentId, shortlist_status) {
  if (!USE_MOCK) return apiFetch('PATCH', `/shortlists/${postingId}/${studentId}`, { shortlist_status });

  await delay();
  const { getDb, updateDb, newId } = await getMock();
  const db = getDb();

  if (!['ranking_locked', 'shortlisting'].includes(db.round.phase)) {
    throw Object.assign(new Error('Action not allowed in current phase'), {
      status: 403, data: { currentPhase: db.round.phase },
    });
  }

  updateDb(db => {
    const i = db.shortlists.findIndex(s => s.posting_id === postingId && s.student_id === studentId && s.round_id === db.round.id);
    if (i >= 0) {
      db.shortlists[i].shortlist_status = shortlist_status;
      db.shortlists[i].updated_at = new Date().toISOString();
    } else {
      db.shortlists.push({
        id: newId('sl'), posting_id: postingId, student_id: studentId,
        round_id: db.round.id, shortlist_status,
        updated_at: new Date().toISOString(),
      });
    }
    return db;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEWS / COMPANY RANKINGS
// ─────────────────────────────────────────────────────────────────────────────

/** GET shortlisted students for a posting (interviews page) */
export async function getShortlistedStudents(postingId) {
  if (!USE_MOCK) return apiFetch('GET', `/postings/${postingId}/shortlisted`);

  await delay();
  const { getDb, getSession, phaseAtLeast } = await getMock();
  const db = getDb();
  const session = getSession();
  const company = db.companies.find(c => c.user_id === session?.id);

  const shortlisted = db.shortlists.filter(
    s => s.posting_id === postingId && s.shortlist_status === 'shortlisted' && s.round_id === db.round.id
  );

  const students = shortlisted.map(sl => {
    const student = db.students.find(s => s.id === sl.student_id);
    if (!student) return null;
    // Contact email always shown for shortlisted students on interviews page (phase >= shortlist_locked)
    const revealContact = phaseAtLeast(db.round.phase, 'shortlist_locked');
    return {
      ...student,
      contact_email: revealContact ? student.contact_email : undefined,
      shortlist_id: sl.id,
    };
  }).filter(Boolean);

  // Get existing company ranking for this posting
  const cr = db.companyRankings.find(r => r.posting_id === postingId && r.round_id === db.round.id);

  return { students, companyRanking: cr || null };
}

/** POST /api/company-rankings */
export async function submitCompanyRanking(postingId, data) {
  if (!USE_MOCK) return apiFetch('POST', '/company-rankings', { posting_id: postingId, ...data });

  await delay();
  const { getDb, updateDb, newId } = await getMock();
  const db = getDb();

  if (!['interviewing', 'company_ranking'].includes(db.round.phase)) {
    throw Object.assign(new Error('Action not allowed in current phase'), {
      status: 403, data: { currentPhase: db.round.phase },
    });
  }

  updateDb(db => {
    const i = db.companyRankings.findIndex(r => r.posting_id === postingId && r.round_id === db.round.id);
    const record = {
      id: i >= 0 ? db.companyRankings[i].id : newId('cr'),
      posting_id: postingId, round_id: db.round.id,
      ordered_student_ids: data.ordered_student_ids || null,
      scores: data.scores || null,
      locked_at: null,
      created_at: new Date().toISOString(),
    };
    if (i >= 0) db.companyRankings[i] = record;
    else db.companyRankings.push(record);
    return db;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/notifications */
export async function getNotifications() {
  if (!USE_MOCK) return apiFetch('GET', '/notifications');

  await delay(50);
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  const notifications = db.notifications
    .filter(n => n.user_id === session?.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { notifications };
}

/** PATCH /api/notifications/:id/read */
export async function markNotificationRead(notificationId) {
  if (!USE_MOCK) return apiFetch('PATCH', `/notifications/${notificationId}/read`);

  await delay(50);
  const { updateDb } = await getMock();
  updateDb(db => {
    const n = db.notifications.find(n => n.id === notificationId);
    if (n) n.read = true;
    return db;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/matches/me */
export async function getMyMatches() {
  if (!USE_MOCK) return apiFetch('GET', '/matches/me');

  await delay();
  const { getDb, getSession } = await getMock();
  const db = getDb();

  if (db.round.phase !== 'revealed') {
    throw Object.assign(new Error('Results not yet revealed'), { status: 403 });
  }

  const session = getSession();

  if (session?.role === 'student') {
    const student = db.students.find(s => s.user_id === session.id);
    if (!student) return { match: null };
    const match = db.matches.find(m => m.student_id === student.id && m.round_id === db.round.id);
    if (!match) return { match: null };
    const posting = db.postings.find(p => p.id === match.posting_id);
    const company = db.companies.find(c => c.id === posting?.company_id);
    return { match: { ...match, posting, company } };
  }

  if (session?.role === 'company') {
    const company = db.companies.find(c => c.user_id === session.id);
    if (!company) return { matches: [] };
    const postings = db.postings.filter(p => p.company_id === company.id);
    const matches = db.matches.filter(m =>
      postings.some(p => p.id === m.posting_id) && m.round_id === db.round.id
    ).map(m => {
      const student = db.students.find(s => s.id === m.student_id);
      const posting = postings.find(p => p.id === m.posting_id);
      return { ...m, student, posting };
    });
    return { matches };
  }

  return { matches: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

export async function adminListStudents() {
  if (!USE_MOCK) return apiFetch('GET', '/admin/students');
  await delay();
  const { getDb } = await getMock();
  return { students: getDb().students };
}

export async function adminListCompanies() {
  if (!USE_MOCK) return apiFetch('GET', '/admin/companies');
  await delay();
  const { getDb } = await getMock();
  return { companies: getDb().companies };
}

export async function adminListRankings() {
  if (!USE_MOCK) return apiFetch('GET', '/admin/rankings');
  await delay();
  const { getDb } = await getMock();
  const db = getDb();
  return { rankings: db.studentRankings.filter(r => r.round_id === db.round.id) };
}

export async function adminListCompanyRankings() {
  if (!USE_MOCK) return apiFetch('GET', '/admin/company-rankings');
  await delay();
  const { getDb } = await getMock();
  const db = getDb();
  return { rankings: db.companyRankings.filter(r => r.round_id === db.round.id) };
}

export async function adminListShortlists() {
  if (!USE_MOCK) return apiFetch('GET', '/admin/shortlists');
  await delay();
  const { getDb } = await getMock();
  const db = getDb();
  return { shortlists: db.shortlists.filter(s => s.round_id === db.round.id) };
}

/** POST /api/admin/rounds/advance-phase */
export async function advancePhase() {
  if (!USE_MOCK) return apiFetch('POST', '/admin/rounds/advance-phase');

  await delay();
  const { getDb, updateDb, PHASE_SEQUENCE, applyPhaseTransitionSideEffects } = await getMock();
  const db = getDb();
  const currentIdx = PHASE_SEQUENCE.indexOf(db.round.phase);
  if (currentIdx >= PHASE_SEQUENCE.length - 1) {
    throw Object.assign(new Error('Already at final phase.'), { status: 400 });
  }
  const newPhase = PHASE_SEQUENCE[currentIdx + 1];

  updateDb(db => {
    db.round.phase = newPhase;
    return applyPhaseTransitionSideEffects(db, newPhase);
  });

  const updated = getDb();
  return { round: updated.round };
}

/** POST /api/admin/rounds/run-matching */
export async function runMatchingNow() {
  if (!USE_MOCK) return apiFetch('POST', '/admin/rounds/run-matching');

  await delay(400);
  const { getDb, updateDb, runMatching } = await getMock();
  const db = getDb();

  const result = runMatching({
    studentRankings: db.studentRankings.filter(sr => sr.round_id === db.round.id),
    companyRankings: db.companyRankings.filter(cr => cr.round_id === db.round.id),
    postings: db.postings.filter(p => p.round_id === db.round.id),
  });

  updateDb(db => {
    // Idempotent: clear existing matches first
    db.matches = db.matches.filter(m => m.round_id !== db.round.id);
    for (const m of result.matched) {
      db.matches.push({
        id: `match-${m.student_id}-${m.posting_id}`,
        round_id: db.round.id,
        student_id: m.student_id,
        posting_id: m.posting_id,
        mutual_score: m.mutual_score,
        created_at: new Date().toISOString(),
      });
    }
    return db;
  });

  // Enrich with names
  const enriched = getDb();
  const matched = result.matched.map(m => {
    const student = enriched.students.find(s => s.id === m.student_id);
    const posting = enriched.postings.find(p => p.id === m.posting_id);
    const company = enriched.companies.find(c => c.id === posting?.company_id);
    return { ...m, student_name: student?.full_name, posting_title: posting?.title, company_name: company?.company_name };
  });

  const unmatched_students = result.unmatched_students.map(id => {
    const s = enriched.students.find(st => st.id === id);
    return { id, full_name: s?.full_name };
  });

  const unmatched_postings = result.unmatched_postings.map(id => {
    const p = enriched.postings.find(po => po.id === id);
    const c = enriched.companies.find(co => co.id === p?.company_id);
    return { id, title: p?.title, company_name: c?.company_name };
  });

  return { matched, unmatched_students, unmatched_postings };
}

/** POST /api/admin/rounds/reset */
export async function resetRound() {
  if (!USE_MOCK) return apiFetch('POST', '/admin/rounds/reset');

  await delay();
  const { updateDb } = await getMock();
  updateDb(db => {
    db.studentRankings = db.studentRankings.filter(r => r.round_id !== db.round.id);
    db.companyRankings = db.companyRankings.filter(r => r.round_id !== db.round.id);
    db.shortlists = db.shortlists.filter(s => s.round_id !== db.round.id);
    db.matches = db.matches.filter(m => m.round_id !== db.round.id);
    db.notifications = [];
    db.round.phase = 'ranking_open';
    return db;
  });
  return { ok: true };
}

/** POST /api/admin/seed — reset entire mock DB to seed */
export async function seed() {
  if (!USE_MOCK) return apiFetch('POST', '/admin/seed');

  await delay();
  const { resetDb } = await getMock();
  resetDb();
  return { ok: true };
}

/** Load preset — demo panel only */
export async function loadPreset(preset) {
  if (!USE_MOCK) return;
  const { loadPreset: lp } = await getMock();
  lp(preset);
  return { ok: true };
}

/** Switch user — demo panel only */
export async function quickLogin(userId) {
  if (!USE_MOCK) return;
  const { getDb, setSession } = await getMock();
  const db = getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  const hasProfile = user.is_admin ? true
    : user.role === 'student' ? db.students.some(s => s.user_id === user.id)
    : db.companies.some(c => c.user_id === user.id);
  const sessionUser = { id: user.id, email: user.email, role: user.role, is_admin: user.is_admin, hasProfile };
  setSession(sessionUser);
  return { user: sessionUser };
}

/** Get dashboard stats for company */
export async function getCompanyStats() {
  if (!USE_MOCK) return apiFetch('GET', '/companies/stats');

  await delay(50);
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  const company = db.companies.find(c => c.user_id === session?.id);
  if (!company) return { postings: 0, applicants: 0, shortlisted: 0 };

  const myPostings = db.postings.filter(p => p.company_id === company.id && p.round_id === db.round.id);
  const postingIds = new Set(myPostings.map(p => p.id));

  let applicants = 0;
  for (const sr of db.studentRankings) {
    for (const pid of sr.ordered_posting_ids) {
      if (postingIds.has(pid)) { applicants++; break; }
    }
  }

  const shortlisted = db.shortlists.filter(
    s => postingIds.has(s.posting_id) && s.shortlist_status === 'shortlisted' && s.round_id === db.round.id
  ).length;

  return { postingsCount: myPostings.length, applicantsCount: applicants, shortlistedCount: shortlisted };
}
