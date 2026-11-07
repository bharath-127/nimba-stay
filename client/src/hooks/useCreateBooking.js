import { useCallback, useRef, useState } from 'react';
import { createBooking } from '../services/bookingService.js';

/**
 * Submits a booking exactly once at a time. The in-flight ref (not just state)
 * guards against a double click landing before React re-renders the disabled
 * button, so the same guest can never be booked twice by accident.
 *
 * `submit` resolves to `{ ok: true, booking }` or `{ ok: false, error }` so the
 * caller can react immediately — reading `error` from state right after the
 * await would see the previous render's value.
 */
export function useCreateBooking() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const inFlight = useRef(false);

  const submit = useCallback(async (payload) => {
    if (inFlight.current) return { ok: false, error: null, skipped: true };
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createBooking(payload);
      setBooking(created);
      return { ok: true, booking: created };
    } catch (err) {
      setError(err);
      return { ok: false, error: err };
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setBooking(null);
  }, []);

  return { submit, submitting, error, booking, reset };
}
