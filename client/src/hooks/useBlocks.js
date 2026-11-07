import { useCallback, useEffect, useState } from 'react';
import { getBlocks, createBlock, liftBlock, getRooms } from '../services/roomService.js';

/** Room blocks (maintenance periods) plus the room list the block form picks from. */
export function useBlocks() {
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, r] = await Promise.all([getBlocks(), getRooms()]);
      setBlocks(b);
      setRooms(r);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Resolves to `{ ok, block }` or `{ ok: false, error }` so the form can react immediately. */
  const create = useCallback(async (roomId, body) => {
    setCreating(true);
    try {
      const block = await createBlock(roomId, body);
      setBlocks((list) => [...list, block].sort((a, b) => a.startDate.localeCompare(b.startDate)));
      return { ok: true, block };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setCreating(false);
    }
  }, []);

  const lift = useCallback(async (id) => {
    setBusyId(id);
    try {
      const result = await liftBlock(id);
      setBlocks((list) => list.filter((b) => b.id !== id));
      return { ok: true, block: result };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setBusyId(null);
    }
  }, []);

  return { blocks, rooms, loading, error, busyId, creating, refresh, create, lift };
}
