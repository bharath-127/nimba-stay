import { useEffect, useState } from 'react';
import { getHealth } from '../services/roomService.js';

/** Lightweight API status indicator for the header. */
export function useHealth() {
  const [health, setHealth] = useState({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((data) => {
        if (!cancelled) setHealth({ status: 'online', transactions: data.transactions });
      })
      .catch(() => {
        if (!cancelled) setHealth({ status: 'offline' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return health;
}
