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

// ── Session (real mode) ───────────────────────────────────────────────────────
// The access token, refresh token and expiry are kept in localStorage so a page
// reload keeps the user signed in. Trade-off: a script injected into the page
// could read them. This app renders no user-supplied HTML, which keeps that
// risk low for the current build.
const SESSION_KEY = 'internmatch.session';
let _session   = null;   // { token, refresh_token, expires_at }
let _refreshing = null;  // at most one refresh request at a time
let _onExpired = null;   // set by AuthContext

function readStored() {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function persist(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* storage unavailable: session lasts until reload */ }
}
function currentSession() { if (!_session) _session = readStored(); return _session; }
function storeSession(data) {
  _session = { token: data.token, refresh_token: data.refresh_token, expires_at: data.expires_at };
  persist(_session);
}
function dropSession() { _session = null; persist(null); }
function expire() { dropSession(); if (_onExpired) _onExpired(); }

/** Kept for older callers. Prefer login()/signup(), which store the whole session. */
export function setAuthToken(token) { _session = { ...(currentSession() || {}), token }; }
export function clearAuthToken()    { dropSession(); }
/** Called once by AuthContext: runs when a session can no longer be renewed. */
export function onSessionExpired(cb) {
  _onExpired = cb;
  return () => { if (_onExpired === cb) _onExpired = null; };
}

/** One HTTP round trip. Turns every failure into an Error with a readable message. */
async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'), { status: 0, data: {} });
  }

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }

  if (!res.ok) {
    const message = data?.error
      || (res.status >= 500 ? 'The server had a problem. Try again in a moment.' : 'Request failed.');
    throw Object.assign(new Error(message), { status: res.status, data: data || {} });
  }
  if (data === null) {
    if (!text) return {}; // 204 or empty body
    throw Object.assign(new Error('Unexpected response from the server.'), { status: res.status, data: {} });
  }
  return data;
}

async function refreshSession() {
  if (_refreshing) return _refreshing;
  const rt = currentSession()?.refresh_token;
  if (!rt) return false;
  _refreshing = (async () => {
    try { storeSession(await request('POST', '/auth/refresh', { refresh_token: rt })); return true; }
    catch { return false; }
    finally { _refreshing = null; }
  })();
  return _refreshing;
}

const NO_REFRESH = new Set(['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout']);

/** Authenticated call. On a 401 it renews the session once and retries once. */
async function apiFetch(method, path, body) {
  try {
    return await request(method, path, body, currentSession()?.token);
  } catch (err) {
    if (err.status !== 401 || NO_REFRESH.has(path) || !currentSession()) throw err;
    if (await refreshSession()) {
      try { return await request(method, path, body, currentSession().token); }
      catch (err2) { if (err2.status === 401) expire(); throw err2; }
    }
    expire();
    throw err;
  }
}

// ── Mock imports (only evaluated when USE_MOCK=true, via dynamic structure) ───
// Lazy import: the mock only loads when USE_MOCK is true.
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

/**
 * Show an API error as a toast, except when the session just ended: the user is
 * already being sent to /login with an explanation, so a second message is noise.
 */
export function showError(toast, err, fallback) {
  if (err?.status === 401) return;
  toast.error(err?.message || fallback);
}

/** Mock only: the real server joins company_name onto every posting it returns. */
function withCompanyName(db, posting) {
  const company = db.companies.find(c => c.id === posting.company_id);
  return { ...posting, company_name: company?.company_name ?? '' };
}

/** Mock only: build an Error shaped like the real API's error responses. */
function apiError(status, message, extra) {
  return Object.assign(new Error(message), { status, data: { error: message, ...extra } });
}
const wrongPhase  = (db) => apiError(403, 'Action not allowed in current phase', { currentPhase: db.round.phase });
const fieldErrors = (fields) => apiError(400, 'Check the highlighted fields.', { fields });

/**
 * Mock only. The real backend checks in this order: role (403), ownership (404),
 * phase (403), then validation (400). The helpers below keep the demo identical.
 */
function requireCompany(db, session) {
  const company = session?.role === 'company' ? db.companies.find(c => c.user_id === session.id) : null;
  if (!company) throw apiError(403, 'Forbidden');
  return company;
}
/** A posting of the current round owned by this company. Someone else's posting looks like a missing one. */
function ownPosting(db, company, postingId) {
  const posting = db.postings.find(p => p.id === postingId && p.company_id === company.id && p.round_id === db.round.id);
  if (!posting) throw apiError(404, 'Posting not found');
  return posting;
}
/** The only student fields a company may see. contact_email is added only when the reveal rule allows it. */
function companyFacingStudent(student) {
  const { id, full_name, department, year, skills, portfolio_url, availability } = student;
  return { id, full_name, department, year, skills, portfolio_url, availability };
}
const POSTING_FIELDS = ['title', 'required_department', 'required_skills', 'capacity'];
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj?.[k] !== undefined).map(k => [k, obj[k]]));

function validatePosting(d, { partial }) {
  const f = {};
  if (!partial || d.title !== undefined) {
    if (typeof d.title !== 'string' || !d.title.trim() || d.title.length > 120) f.title = 'Enter a title (up to 120 characters).';
  }
  if (d.required_department !== undefined && typeof d.required_department !== 'string') f.required_department = 'Must be text.';
  if (d.required_skills !== undefined && !(Array.isArray(d.required_skills) && d.required_skills.every(x => typeof x === 'string'))) {
    f.required_skills = 'Must be a list of skills.';
  }
  if (!partial || d.capacity !== undefined) {
    if (!Number.isInteger(d.capacity) || d.capacity < 1 || d.capacity > 10) f.capacity = 'Must be a whole number from 1 to 10.';
  }
  return f;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

function assertRole(role) {
  if (role !== 'student' && role !== 'company') {
    throw Object.assign(new Error('Choose student or company.'), {
      status: 400, data: { fields: { role: 'Must be student or company' } },
    });
  }
}

/** POST /api/auth/login -> { user } (the session tokens are stored internally) */
export async function login(email, password) {
  if (!USE_MOCK) {
    const data = await request('POST', '/auth/login', { email, password });
    storeSession(data);
    return { user: data.user };
  }

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

/** POST /api/auth/signup -> { user }. Only 'student' and 'company' are accepted. */
export async function signup(email, password, role) {
  assertRole(role);
  if (!USE_MOCK) {
    const data = await request('POST', '/auth/signup', { email, password, role });
    storeSession(data);
    return { user: data.user };
  }

  await delay();
  const { getDb, updateDb, newId, setSession } = await getMock();
  const db = getDb();
  if (db.users.find(u => u.email === email)) {
    throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
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

/** GET /api/auth/me -> { user } or { user: null } when nobody is signed in. */
export async function getCurrentUser() {
  if (!USE_MOCK) {
    if (!currentSession()?.token) return { user: null }; // nothing to restore, skip the request
    const data = await apiFetch('GET', '/auth/me');
    return { user: data.user ?? null };
  }

  await delay(50);
  const { getSession } = await getMock();
  return { user: getSession() || null };
}

/** POST /api/auth/logout. Never throws: local sign-out always succeeds. */
export async function logout() {
  if (!USE_MOCK) {
    try { if (currentSession()?.token) await request('POST', '/auth/logout', undefined, currentSession().token); }
    catch { /* the server may be unreachable; sign out locally anyway */ }
    dropSession();
    return { ok: true };
  }
  const { clearSession } = await getMock();
  clearSession();
  return { ok: true };
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

  // The server decides id, user_id and contact_email. Anything sent for them is ignored.
  const { id: _id, user_id: _uid, contact_email: _ce, ...fields } = data;
  const studentId = newId('s');
  const student = {
    id: studentId, user_id: session.id, ...fields,
    contact_email: session.email, created_at: new Date().toISOString(),
  };
  updateDb(db => {
    db.students.push(student);
    const user = db.users.find(u => u.id === session.id);
    if (user) user.hasProfile = true;
    return db;
  });
  const updated = { ...session, hasProfile: true };
  setSession(updated);
  return { student };
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

/** PATCH /api/students/me — partial update, returns { student } */
export async function updateStudentProfile(data) {
  if (!USE_MOCK) return apiFetch('PATCH', '/students/me', data);

  await delay();
  const { updateDb, getDb, getSession } = await getMock();
  const session = getSession();
  if (!session || session.role !== 'student') throw Object.assign(new Error('Forbidden'), { status: 403 });
  // contact_email comes from the account and is never editable here
  const { contact_email, id, user_id, ...allowed } = data;
  updateDb(db => {
    const i = db.students.findIndex(s => s.user_id === session.id);
    if (i >= 0) Object.assign(db.students[i], allowed);
    return db;
  });
  return { student: getDb().students.find(s => s.user_id === session.id) || null };
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
  const postings = db.postings.filter(p => p.round_id === db.round.id).map(p => withCompanyName(db, p));

  // all=true (or nobody to filter for): `postings` is every posting
  if (all || !session) return { postings, allPostings: postings };

  const student = db.students.find(s => s.user_id === session.id);
  if (!student) return { postings, allPostings: postings };

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
  const postings = db.postings
    .filter(p => p.company_id === company.id && p.round_id === db.round.id)
    .map(p => withCompanyName(db, p));
  return { postings };
}

/** POST /api/postings. Only while ranking is open. */
export async function createPosting(data) {
  if (!USE_MOCK) return apiFetch('POST', '/postings', data);

  await delay();
  const { getDb, updateDb, newId, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  if (db.round.phase !== 'ranking_open') throw wrongPhase(db);

  const input = pick(data, POSTING_FIELDS);
  const fields = validatePosting(input, { partial: false });
  if (Object.keys(fields).length) throw fieldErrors(fields);

  // Only the four listed fields come from the client; the server sets everything else.
  const posting = {
    id: newId('p'), company_id: company.id, round_id: db.round.id,
    title: input.title.trim(),
    required_department: input.required_department ?? '',
    required_skills: input.required_skills ?? [],
    capacity: input.capacity,
    created_at: new Date().toISOString(),
  };
  updateDb(d => { d.postings.push(posting); return d; });
  return { posting: { ...posting, company_name: company.company_name } };
}

/** PATCH /api/postings/:id. Owner only, only while ranking is open. */
export async function updatePosting(postingId, data) {
  if (!USE_MOCK) return apiFetch('PATCH', `/postings/${postingId}`, data);

  await delay();
  const { getDb, updateDb, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  if (db.round.phase !== 'ranking_open') throw wrongPhase(db);

  const changes = pick(data, POSTING_FIELDS); // id, company_id, round_id and anything else are ignored
  const fields = validatePosting(changes, { partial: true });
  if (Object.keys(fields).length) throw fieldErrors(fields);
  if (typeof changes.title === 'string') changes.title = changes.title.trim();

  updateDb(d => { Object.assign(d.postings.find(p => p.id === postingId), changes); return d; });
  return { ok: true };
}

/** DELETE /api/postings/:id. Owner only, only while ranking is open. Removes everything that points at it. */
export async function deletePosting(postingId) {
  if (!USE_MOCK) return apiFetch('DELETE', `/postings/${postingId}`);

  await delay();
  const { getDb, updateDb, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  if (db.round.phase !== 'ranking_open') throw wrongPhase(db);

  updateDb(d => {
    d.postings = d.postings.filter(p => p.id !== postingId);
    for (const sr of d.studentRankings) sr.ordered_posting_ids = sr.ordered_posting_ids.filter(id => id !== postingId);
    d.shortlists = d.shortlists.filter(sl => sl.posting_id !== postingId);
    d.companyRankings = d.companyRankings.filter(r => r.posting_id !== postingId);
    d.interviewNotes = (d.interviewNotes || []).filter(n => n.posting_id !== postingId);
    return d;
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
  const session = getSession();
  const student = session?.role === 'student' ? db.students.find(s => s.user_id === session.id) : null;
  if (!student) throw apiError(403, 'Forbidden');
  if (db.round.phase !== 'ranking_open') throw wrongPhase(db);

  const known = new Set(db.postings.filter(p => p.round_id === db.round.id).map(p => p.id));
  if (!Array.isArray(orderedPostingIds) || orderedPostingIds.some(id => typeof id !== 'string') ||
      new Set(orderedPostingIds).size !== orderedPostingIds.length || orderedPostingIds.some(id => !known.has(id))) {
    throw fieldErrors({ ordered_posting_ids: 'Must be a list of unique postings from this round.' });
  }

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

  const { id: _id, user_id: _uid, ...fields } = data;
  const companyId = newId('co');
  const company = { id: companyId, user_id: session.id, ...fields, created_at: new Date().toISOString() };
  updateDb(db => {
    db.companies.push(company);
    const user = db.users.find(u => u.id === session.id);
    if (user) user.hasProfile = true;
    return db;
  });
  const updated = { ...session, hasProfile: true };
  setSession(updated);
  return { company };
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

/** PATCH /api/companies/me — partial update, returns { company } */
export async function updateCompanyProfile(data) {
  if (!USE_MOCK) return apiFetch('PATCH', '/companies/me', data);

  await delay();
  const { updateDb, getDb, getSession } = await getMock();
  const session = getSession();
  if (!session || session.role !== 'company') throw Object.assign(new Error('Forbidden'), { status: 403 });
  const { id, user_id, ...allowed } = data;
  updateDb(db => {
    const i = db.companies.findIndex(c => c.user_id === session.id);
    if (i >= 0) Object.assign(db.companies[i], allowed);
    return db;
  });
  return { company: getDb().companies.find(c => c.user_id === session.id) || null };
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICANTS & SHORTLISTS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/postings/:id/applicants. Owner only, from ranking_locked onward. */
export async function getApplicants(postingId) {
  if (!USE_MOCK) return apiFetch('GET', `/postings/${postingId}/applicants`);

  await delay();
  const { getDb, getSession, phaseAtLeast } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  if (!phaseAtLeast(db.round.phase, 'ranking_locked')) throw wrongPhase(db);

  // contact_email only for shortlisted students, and only from shortlist_locked onward
  const contactOpen = phaseAtLeast(db.round.phase, 'shortlist_locked');
  const applicants = [];
  for (const sr of db.studentRankings) {
    if (sr.round_id !== db.round.id) continue;
    const rankPos = sr.ordered_posting_ids.indexOf(postingId);
    if (rankPos === -1) continue;
    const student = db.students.find(s => s.id === sr.student_id);
    if (!student) continue;

    const sl = db.shortlists.find(x => x.posting_id === postingId && x.student_id === student.id && x.round_id === db.round.id);
    const shortlist_status = sl?.shortlist_status || 'pending';
    const applicant = { ...companyFacingStudent(student), rank_position: rankPos + 1, shortlist_status };
    if (contactOpen && shortlist_status === 'shortlisted') applicant.contact_email = student.contact_email;
    applicants.push(applicant);
  }
  applicants.sort((a, b) => a.rank_position - b.rank_position);
  return { applicants };
}

/** PATCH /api/shortlists/:postingId/:studentId. Owner only, in ranking_locked or shortlisting. */
export async function updateShortlist(postingId, studentId, shortlist_status) {
  if (!USE_MOCK) return apiFetch('PATCH', `/shortlists/${postingId}/${studentId}`, { shortlist_status });

  await delay();
  const { getDb, updateDb, newId, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  if (!['ranking_locked', 'shortlisting'].includes(db.round.phase)) throw wrongPhase(db);

  if (!['shortlisted', 'rejected', 'pending'].includes(shortlist_status)) {
    throw fieldErrors({ shortlist_status: 'Must be shortlisted, rejected or pending.' });
  }
  const applied = db.studentRankings.some(sr =>
    sr.round_id === db.round.id && sr.student_id === studentId && sr.ordered_posting_ids.includes(postingId));
  if (!applied) throw apiError(404, 'Applicant not found');

  updateDb(d => {
    const i = d.shortlists.findIndex(x => x.posting_id === postingId && x.student_id === studentId && x.round_id === d.round.id);
    if (i >= 0) {
      d.shortlists[i].shortlist_status = shortlist_status;
      d.shortlists[i].updated_at = new Date().toISOString();
    } else {
      d.shortlists.push({
        id: newId('sl'), posting_id: postingId, student_id: studentId,
        round_id: d.round.id, shortlist_status, updated_at: new Date().toISOString(),
      });
    }
    return d;
  });
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEWS / COMPANY RANKINGS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/postings/:id/shortlisted. Owner only. Includes saved interview notes. */
export async function getShortlistedStudents(postingId) {
  if (!USE_MOCK) return apiFetch('GET', `/postings/${postingId}/shortlisted`);

  await delay();
  const { getDb, getSession, phaseAtLeast } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);

  const contactOpen = phaseAtLeast(db.round.phase, 'shortlist_locked');
  const students = db.shortlists
    .filter(sl => sl.posting_id === postingId && sl.shortlist_status === 'shortlisted' && sl.round_id === db.round.id)
    .map(sl => {
      const student = db.students.find(s => s.id === sl.student_id);
      if (!student) return null;
      const note = (db.interviewNotes || []).find(n => n.posting_id === postingId && n.student_id === student.id);
      const out = { ...companyFacingStudent(student), shortlist_id: sl.id, notes: note?.notes ?? '' };
      if (contactOpen) out.contact_email = student.contact_email;
      return out;
    })
    .filter(Boolean);

  const companyRanking = db.companyRankings.find(r => r.posting_id === postingId && r.round_id === db.round.id) || null;
  return { students, companyRanking };
}

/** POST /api/company-rankings. Owner only, interviewing or company_ranking. Send an order OR scores. */
export async function submitCompanyRanking(postingId, data) {
  if (!USE_MOCK) return apiFetch('POST', '/company-rankings', { posting_id: postingId, ...data });

  await delay();
  const { getDb, updateDb, newId, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  if (!['interviewing', 'company_ranking'].includes(db.round.phase)) throw wrongPhase(db);

  const hasOrder  = Array.isArray(data?.ordered_student_ids);
  const hasScores = data?.scores != null && typeof data.scores === 'object' && !Array.isArray(data.scores);
  if (hasOrder === hasScores) {
    throw fieldErrors({ ordered_student_ids: 'Send either an order or scores, never both and never neither.' });
  }

  const shortlisted = new Set(db.shortlists
    .filter(sl => sl.posting_id === postingId && sl.shortlist_status === 'shortlisted' && sl.round_id === db.round.id)
    .map(sl => sl.student_id));

  if (hasOrder) {
    const ids = data.ordered_student_ids;
    if (new Set(ids).size !== ids.length || ids.some(id => !shortlisted.has(id))) {
      throw fieldErrors({ ordered_student_ids: 'Must list each shortlisted student at most once.' });
    }
  } else {
    const entries = Object.entries(data.scores);
    if (entries.some(([id, v]) => !shortlisted.has(id) || !Number.isInteger(v) || v < 1 || v > 10)) {
      throw fieldErrors({ scores: 'Scores must be whole numbers from 1 to 10 for shortlisted students.' });
    }
  }

  updateDb(d => {
    const i = d.companyRankings.findIndex(r => r.posting_id === postingId && r.round_id === d.round.id);
    const record = {
      id: i >= 0 ? d.companyRankings[i].id : newId('cr'),
      posting_id: postingId, round_id: d.round.id,
      ordered_student_ids: hasOrder ? data.ordered_student_ids : null,
      scores: hasScores ? data.scores : null,
      locked_at: null,
      created_at: new Date().toISOString(),
    };
    if (i >= 0) d.companyRankings[i] = record; else d.companyRankings.push(record);
    return d;
  });
  return { ok: true };
}

/** PUT /api/postings/:postingId/notes/:studentId. Owner only, interviewing or company_ranking. */
export async function saveInterviewNotes(postingId, studentId, notes) {
  if (!USE_MOCK) return apiFetch('PUT', `/postings/${postingId}/notes/${studentId}`, { notes });

  await delay(100);
  const { getDb, updateDb, newId, getSession } = await getMock();
  const db = getDb();
  const company = requireCompany(db, getSession());
  ownPosting(db, company, postingId);
  const isShortlisted = db.shortlists.some(sl => sl.posting_id === postingId && sl.student_id === studentId &&
    sl.shortlist_status === 'shortlisted' && sl.round_id === db.round.id);
  if (!isShortlisted) throw apiError(404, 'Student not found');
  if (!['interviewing', 'company_ranking'].includes(db.round.phase)) throw wrongPhase(db);
  if (typeof notes !== 'string' || notes.length > 2000) {
    throw fieldErrors({ notes: 'Notes must be text of at most 2000 characters.' });
  }

  updateDb(d => {
    d.interviewNotes = d.interviewNotes || [];
    const i = d.interviewNotes.findIndex(n => n.posting_id === postingId && n.student_id === studentId);
    if (notes === '') { if (i >= 0) d.interviewNotes.splice(i, 1); }
    else if (i >= 0) { d.interviewNotes[i].notes = notes; d.interviewNotes[i].updated_at = new Date().toISOString(); }
    else d.interviewNotes.push({ id: newId('in'), round_id: d.round.id, posting_id: postingId, student_id: studentId, notes, updated_at: new Date().toISOString() });
    return d;
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

/** GET /api/matches/me. Only when results are revealed. Field-by-field, never whole rows. */
export async function getMyMatches() {
  if (!USE_MOCK) return apiFetch('GET', '/matches/me');

  await delay();
  const { getDb, getSession } = await getMock();
  const db = getDb();
  const session = getSession();
  if (session?.role !== 'student' && session?.role !== 'company') throw apiError(403, 'Forbidden');
  if (db.round.phase !== 'revealed') throw apiError(403, 'Results not yet revealed', { currentPhase: db.round.phase });

  const matchFields = (m) => pick(m, ['id', 'round_id', 'student_id', 'posting_id', 'mutual_score', 'created_at']);

  if (session.role === 'student') {
    const student = db.students.find(s => s.user_id === session.id);
    const match = student && db.matches.find(m => m.student_id === student.id && m.round_id === db.round.id);
    if (!match) return { match: null };
    const posting = db.postings.find(p => p.id === match.posting_id);
    const company = db.companies.find(c => c.id === posting?.company_id);
    return {
      match: {
        ...matchFields(match),
        posting: posting ? pick(posting, ['id', 'title', 'required_department', 'required_skills', 'capacity']) : null,
        company: company ? pick(company, ['id', 'company_name', 'contact_person', 'industry', 'logo_url']) : null,
      },
    };
  }

  const company = db.companies.find(c => c.user_id === session.id);
  if (!company) return { matches: [] };
  const postings = db.postings.filter(p => p.company_id === company.id);
  const matches = db.matches
    .filter(m => m.round_id === db.round.id && postings.some(p => p.id === m.posting_id))
    .map(m => {
      const student = db.students.find(s => s.id === m.student_id);
      const posting = postings.find(p => p.id === m.posting_id);
      return {
        ...matchFields(m),
        // a matched student was necessarily shortlisted, so the contact email is part of the result
        student: student ? { ...companyFacingStudent(student), contact_email: student.contact_email } : null,
        posting: { id: posting.id, title: posting.title },
      };
    });
  return { matches };
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
    db.interviewNotes = [];
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
  if (!company) return { postingsCount: 0, applicantsCount: 0, shortlistedCount: 0 };

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
