import { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';

// Loads the active round (id, label, phase, target dates) from GET /api/rounds/current.
export function useRound() {
  const [round, setRound] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/rounds/current')
      .then((r) => !cancelled && setRound(r))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  return { round, error, loading };
}
