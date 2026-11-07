import { useCallback, useRef, useState } from 'react';
import { getAvailability } from '../services/availabilityService.js';

const initial = { status: 'idle', data: null, error: null, params: null };

/**
 * Availability search state machine: idle -> loading -> success | error.
 * A request counter discards responses from superseded searches, so a slow
 * earlier search can never overwrite the results of a newer one.
 */
export function useAvailability() {
  const [state, setState] = useState(initial);
  const requestId = useRef(0);

  const search = useCallback(async (params) => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, status: 'loading', error: null, params }));
    try {
      const data = await getAvailability(params);
      if (id !== requestId.current) return null;
      setState({ status: 'success', data, error: null, params });
      return data;
    } catch (error) {
      if (id !== requestId.current) return null;
      setState((s) => ({ ...s, status: 'error', error }));
      return null;
    }
  }, []);

  const refresh = useCallback(() => (state.params ? search(state.params) : Promise.resolve(null)), [search, state.params]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setState(initial);
  }, []);

  return { ...state, search, refresh, reset };
}
