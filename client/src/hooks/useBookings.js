import { useCallback, useEffect, useState } from 'react';
import { getBookings, cancelBooking } from '../services/bookingService.js';

/** Recent bookings list with cancel support. */
export function useBookings({ limit = 10 } = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await getBookings({ limit }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancel = useCallback(
    async (id) => {
      setCancellingId(id);
      setCancelError(null);
      try {
        const updated = await cancelBooking(id);
        setBookings((list) => list.map((b) => (b.id === id ? updated : b)));
        return updated;
      } catch (err) {
        setCancelError(err);
        return null;
      } finally {
        setCancellingId(null);
      }
    },
    []
  );

  return { bookings, loading, error, refresh, cancel, cancellingId, cancelError };
}
