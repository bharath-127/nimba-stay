import { useCallback, useEffect, useRef, useState } from 'react';
import { getStats } from '../services/statsService.js';
import { todayIso } from '../utils/dates.js';

/**
 * Dashboard summary numbers, always fetched from the API — never derived
 * on the client. Previous values stay on screen while a refresh is in
 * flight, and out-of-order responses are discarded.
 */
export function useStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const next = await getStats({ date: todayIso() });
      if (id === requestId.current) setData(next);
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
