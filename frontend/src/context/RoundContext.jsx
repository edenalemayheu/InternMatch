/**
 * RoundContext — current round state.
 * Components use useRound() hook exclusively.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../lib/apiClient.js';

const RoundCtx = createContext(null);

export const PHASE_SEQUENCE = [
  'ranking_open', 'ranking_locked', 'shortlisting', 'shortlist_locked',
  'interviewing', 'company_ranking', 'company_locked', 'matched', 'revealed',
];

export const PHASE_LABELS = {
  ranking_open:     'Ranking Open',
  ranking_locked:   'Ranking Locked',
  shortlisting:     'Shortlisting',
  shortlist_locked: 'Shortlist Locked',
  interviewing:     'Interviewing',
  company_ranking:  'Company Ranking',
  company_locked:   'Company Locked',
  matched:          'Matched',
  revealed:         'Revealed',
};

export function phaseAtLeast(current, target) {
  return PHASE_SEQUENCE.indexOf(current) >= PHASE_SEQUENCE.indexOf(target);
}

export function RoundProvider({ children }) {
  const [round, setRound]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRound = useCallback(async () => {
    try {
      const { round: r } = await api.getCurrentRound();
      setRound(r);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRound(); }, [fetchRound]);

  return (
    <RoundCtx.Provider value={{ round, loading, refresh: fetchRound }}>
      {children}
    </RoundCtx.Provider>
  );
}

export function useRound() {
  const ctx = useContext(RoundCtx);
  if (!ctx) throw new Error('useRound must be inside RoundProvider');
  return ctx;
}
