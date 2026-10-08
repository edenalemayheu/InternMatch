/**
 * mockDb.js — In-memory database backed by localStorage.
 * All reads/writes go through this module.
 * When VITE_USE_MOCK=true, apiClient.js imports from here instead of fetch.
 *
 * State persists in localStorage under key 'internmatch_mock_db'.
 * Call resetDb() to restore seed state.
 */
import {
  DEMO_ACCOUNTS, SEED_ROUND, SEED_COMPANIES, SEED_POSTINGS,
  SEED_STUDENTS, SEED_STUDENT_RANKINGS, SEED_COMPANY_RANKINGS,
  SEED_SHORTLISTS, SEED_NOTIFICATIONS, SEED_MATCHES,
} from './seedData.js';
import { runMatching } from './mockMatching.js';

const STORAGE_KEY = 'internmatch_mock_db';
const SESSION_KEY = 'internmatch_mock_session';

function makeSeed() {
  return {
    users: DEMO_ACCOUNTS.map(a => ({
      id: a.id, email: a.email, password: a.password,
      role: a.role, is_admin: a.is_admin, created_at: new Date().toISOString(),
    })),
    round: { ...SEED_ROUND },
    companies: SEED_COMPANIES.map(c => ({ ...c })),
    students: SEED_STUDENTS.map(s => ({ ...s })),
    postings: SEED_POSTINGS.map(p => ({ ...p })),
    studentRankings: [],   // fresh — no rankings by default
    companyRankings: [],
    shortlists: [],
    matches: [],
    notifications: [],
    nextId: 1000,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return makeSeed();
}

function save(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb() {
  const fresh = makeSeed();
  save(fresh);
  return fresh;
}

export function getDb() { return load(); }

export function updateDb(fn) {
  const db = load();
  const updated = fn(db);
  save(updated);
  return updated;
}

// ── Session ───────────────────────────────────────────────────────────────────
export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── ID generator ─────────────────────────────────────────────────────────────
export function newId(prefix = 'id') {
  const db = load();
  db.nextId = (db.nextId || 1000) + 1;
  save(db);
  return `${prefix}-${db.nextId}`;
}

// ── Phase order ───────────────────────────────────────────────────────────────
export const PHASE_SEQUENCE = [
  'ranking_open', 'ranking_locked', 'shortlisting', 'shortlist_locked',
  'interviewing', 'company_ranking', 'company_locked', 'matched', 'revealed',
];

export function phaseIndex(phase) {
  return PHASE_SEQUENCE.indexOf(phase);
}

export function phaseAtLeast(currentPhase, targetPhase) {
  return phaseIndex(currentPhase) >= phaseIndex(targetPhase);
}

// ── Apply side effects when phase transitions ─────────────────────────────────
// Implements admin-and-auth.md §2.3
export function applyPhaseTransitionSideEffects(db, newPhase) {
  if (newPhase === 'ranking_locked') {
    // Lock all existing student rankings
    db.studentRankings = db.studentRankings.map(sr => ({
      ...sr, locked_at: sr.locked_at || new Date().toISOString(),
    }));
  }

  if (newPhase === 'shortlist_locked') {
    // Notify shortlisted students
    const shortlisted = db.shortlists.filter(sl => sl.shortlist_status === 'shortlisted');
    for (const sl of shortlisted) {
      const student = db.students.find(s => s.id === sl.student_id);
      const posting = db.postings.find(p => p.id === sl.posting_id);
      const company = db.companies.find(c => c.id === posting?.company_id);
      if (student && student.user_id) {
        const existing = db.notifications.find(n =>
          n.user_id === student.user_id && n.type === 'shortlisted' &&
          n.message.includes(posting?.title || '')
        );
        if (!existing) {
          db.notifications.push({
            id: `notif-${Date.now()}-${student.id}`,
            user_id: student.user_id,
            type: 'shortlisted',
            message: `You've been shortlisted by ${company?.company_name || 'a company'} for ${posting?.title || 'a posting'}.`,
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  if (newPhase === 'company_locked') {
    // Lock all company rankings
    db.companyRankings = db.companyRankings.map(cr => ({
      ...cr, locked_at: cr.locked_at || new Date().toISOString(),
    }));
  }

  if (newPhase === 'matched') {
    // Auto-run matching if no matches exist
    if (!db.matches || db.matches.length === 0) {
      const result = runMatching({
        studentRankings: db.studentRankings,
        companyRankings: db.companyRankings,
        postings: db.postings.filter(p => p.round_id === db.round.id),
      });
      db.matches = result.matched.map(m => ({
        id: `match-${m.student_id}-${m.posting_id}`,
        round_id: db.round.id,
        student_id: m.student_id,
        posting_id: m.posting_id,
        mutual_score: m.mutual_score,
        created_at: new Date().toISOString(),
      }));
    }
  }

  if (newPhase === 'revealed') {
    // Notify matched students and unmatched students
    const matchedStudentIds = new Set(db.matches.map(m => m.student_id));
    const allRankedStudentIds = db.studentRankings.map(sr => sr.student_id);

    for (const studentId of allRankedStudentIds) {
      const student = db.students.find(s => s.id === studentId);
      if (!student || !student.user_id) continue;

      if (matchedStudentIds.has(studentId)) {
        const match = db.matches.find(m => m.student_id === studentId);
        const posting = db.postings.find(p => p.id === match?.posting_id);
        const company = db.companies.find(c => c.id === posting?.company_id);
        db.notifications.push({
          id: `notif-matched-${studentId}`,
          user_id: student.user_id,
          type: 'matched',
          message: `You've been matched with ${company?.company_name || 'a company'} for ${posting?.title || 'a posting'}.`,
          read: false,
          created_at: new Date().toISOString(),
        });
      } else {
        db.notifications.push({
          id: `notif-not-matched-${studentId}`,
          user_id: student.user_id,
          type: 'not_matched',
          message: "You weren't matched this round — you're automatically eligible for the next round.",
          read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return db;
}

// ── Preset loaders ────────────────────────────────────────────────────────────
export function loadPreset(preset) {
  // preset: 'fresh' | 'mid' | 'matchday'
  const db = makeSeed();

  if (preset === 'fresh') {
    // Profiles only, no rankings
    save(db);
    return db;
  }

  if (preset === 'mid') {
    // Rankings submitted, some shortlists, phase = shortlisting
    db.studentRankings = SEED_STUDENT_RANKINGS.map(sr => ({
      ...sr, locked_at: new Date().toISOString(),
    }));
    db.shortlists = SEED_SHORTLISTS.map(sl => ({ ...sl }));
    db.round.phase = 'shortlisting';
    save(db);
    return db;
  }

  if (preset === 'matchday') {
    // Full data, matches run, phase = revealed
    db.studentRankings = SEED_STUDENT_RANKINGS.map(sr => ({
      ...sr, locked_at: new Date().toISOString(),
    }));
    db.companyRankings = SEED_COMPANY_RANKINGS.map(cr => ({
      ...cr, locked_at: new Date().toISOString(),
    }));
    db.shortlists = SEED_SHORTLISTS.map(sl => ({ ...sl }));

    const result = runMatching({
      studentRankings: db.studentRankings,
      companyRankings: db.companyRankings,
      postings: db.postings,
    });
    db.matches = result.matched.map(m => ({
      id: `match-${m.student_id}-${m.posting_id}`,
      round_id: db.round.id,
      student_id: m.student_id,
      posting_id: m.posting_id,
      mutual_score: m.mutual_score,
      created_at: new Date().toISOString(),
    }));

    db.round.phase = 'revealed';

    // Add reveal notifications
    const matchedIds = new Set(result.matched.map(m => m.student_id));
    for (const sr of db.studentRankings) {
      const student = db.students.find(s => s.id === sr.student_id);
      if (!student?.user_id) continue;
      if (matchedIds.has(sr.student_id)) {
        const match = db.matches.find(m => m.student_id === sr.student_id);
        const posting = db.postings.find(p => p.id === match?.posting_id);
        const company = db.companies.find(c => c.id === posting?.company_id);
        db.notifications.push({ id: `n-m-${sr.student_id}`, user_id: student.user_id, type: 'matched', message: `You've been matched with ${company?.company_name} for ${posting?.title}.`, read: false, created_at: new Date().toISOString() });
      } else {
        db.notifications.push({ id: `n-nm-${sr.student_id}`, user_id: student.user_id, type: 'not_matched', message: "You weren't matched this round — you're automatically eligible for the next round.", read: false, created_at: new Date().toISOString() });
      }
    }

    save(db);
    return db;
  }

  save(db);
  return db;
}
