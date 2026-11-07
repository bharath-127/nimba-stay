import { useCallback, useEffect, useState } from 'react';
import { getBookings, cancelBooking, checkOutBooking } from '../services/bookingService.js';

/** Recent bookings list with cancel and check-out support. */
export function useBookings({ limit = 10 } = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  const run = useCallback(async (id, action) => {
    setBusyId(id);
    setActionError(null);
    try {
      const updated = await action(id);
      setBookings((list) => list.map((b) => (b.id === id ? updated : b)));
      return updated;
    } catch (err) {
      setActionError(err);
      return null;
    } finally {
      setBusyId(null);
    }
  }, []);

  const cancel = useCallback((id) => run(id, cancelBooking), [run]);
  const checkOut = useCallback((id) => run(id, (bookingId) => checkOutBooking(bookingId)), [run]);

  return { bookings, loading, error, refresh, cancel, checkOut, busyId, actionError };
}
