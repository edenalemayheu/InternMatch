/**
 * storage.js — localStorage persistence for the InternMatch demo.
 *
 * All state lives under one key: 'im:store'.
 * A version key forces a fresh seed if the schema changes.
 * resetDemo() wipes the store and reloads from the seed.
 *
 * Shape of the store:
 * {
 *   _version:         string,
 *   currentUserId:    string | null,
 *   users:            User[],
 *   students:         Student[],
 *   companies:        Company[],
 *   postings:         Posting[],
 *   round:            Round,
 *   studentRankings:  StudentRanking[],
 *   companyRankings:  CompanyRanking[],
 *   shortlists:       Shortlist[],
 *   notifications:    Notification[],
 *   matches:          Match[],
 * }
 */
import { SEED } from './seed.js';

export const STORE_VERSION = '1.0.0';
const STORE_KEY = 'im:store';

// ── Build initial store from seed ─────────────────────────────────────────────
function buildInitialStore() {
  return {
    _version:        STORE_VERSION,
    currentUserId:   null,
    users:           SEED.users.map(u => ({ ...u })),
    students:        SEED.students.map(s => ({ ...s })),
    companies:       SEED.companies.map(c => ({ ...c })),
    postings:        SEED.postings.map(p => ({ ...p })),
    round:           { ...SEED.round },
    studentRankings: [],          // start empty — users fill during demo
    companyRankings: [],          // start empty — filled by autoFillRankings or manual
    shortlists:      [],          // start empty
    notifications:   [],          // start empty
    matches:         [],
  };
}

// ── Read / write ──────────────────────────────────────────────────────────────
export function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return resetToSeed();
    const store = JSON.parse(raw);
    // Version mismatch → re-seed
    if (store._version !== STORE_VERSION) return resetToSeed();
    return store;
  } catch {
    return resetToSeed();
  }
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('[storage] Could not write to localStorage:', e.message);
  }
}

// ── Mutable accessor (load once per operation) ────────────────────────────────
// Callers: load, mutate, save — never hold a reference across async gaps.
export function getStore() {
  return loadStore();
}

export function setStore(store) {
  saveStore(store);
}

// ── Convenience: update a single collection ───────────────────────────────────
export function updateStore(updater) {
  const store = getStore();
  const next  = updater(store);
  setStore(next);
  return next;
}

// ── resetDemo ─────────────────────────────────────────────────────────────────
/**
 * Wipes all state and reloads from the seed.
 * Called by api.resetDemo() and the DemoGuide "Reset Demo" button.
 */
export function resetToSeed() {
  const fresh = buildInitialStore();
  saveStore(fresh);
  return fresh;
}
