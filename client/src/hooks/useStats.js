import { useCallback, useEffect, useRef, useState } from 'react';
import { getStats } from '../services/statsService.js';

/**
 * Dashboard summary numbers, always fetched from the API — never derived
 * on the client. `load(range)` switches the dates the summary describes
 * (null = tonight); `refresh()` re-fetches the current ones. Previous values
 * stay on screen while a request is in flight, and out-of-order responses
 * are discarded.
 */
export function useStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(null);
  const requestId = useRef(0);
  const current = useRef(null);

  const fetchFor = useCallback(async (next) => {
    const id = ++requestId.current;
    current.current = next;
    setLoading(true);
    setError(null);
    try {
      const result = await getStats(next ?? {});
      if (id === requestId.current) setData(result);
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const load = useCallback(
    (next) => {
      const normalised = next?.checkIn && next?.checkOut ? { checkIn: next.checkIn, checkOut: next.checkOut } : null;
      setRange(normalised);
      return fetchFor(normalised);
    },
    [fetchFor]
  );

  const refresh = useCallback(() => fetchFor(current.current), [fetchFor]);

  useEffect(() => {
    fetchFor(null);
  }, [fetchFor]);

  return { data, loading, error, range, load, refresh };
}
