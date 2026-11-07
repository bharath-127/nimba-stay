import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth } from '../services/roomService.js';

const DEFAULT_INTERVAL_MS = 15_000;

/**
 * Live backend health for the header indicator.
 *   online   — API reachable and MongoDB connected (200)
 *   degraded — API reachable but the database is not (503)
 *   offline  — API unreachable (network error / timeout)
 * Re-checks on an interval, when the tab becomes visible again and when the
 * browser regains connectivity; marks offline immediately when it loses it.
 */
export function useHealth({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  const [health, setHealth] = useState({ status: 'checking', checkedAt: null });
  const mounted = useRef(true);

  const check = useCallback(async () => {
    try {
      const data = await getHealth();
      if (mounted.current) {
        setHealth({ status: 'online', transactions: data.transactions, database: data.database, checkedAt: new Date() });
      }
    } catch (err) {
      if (mounted.current) {
        setHealth({ status: err?.status === 503 ? 'degraded' : 'offline', message: err?.message, checkedAt: new Date() });
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    check();
    const timer = setInterval(check, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const onOffline = () => setHealth({ status: 'offline', message: 'This device is offline', checkedAt: new Date() });

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', check);
    window.addEventListener('offline', onOffline);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', onOffline);
    };
  }, [check, intervalMs]);

  return { ...health, check };
}
