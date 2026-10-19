// Fetches the admin's events once per session, unless they are already cached.
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchEvents } from './eventsThunks';

/**
 * Safe to call from the shell and from every event-aware page: the API is hit
 * only when nothing is loaded yet (or the previous attempt failed).
 */
export function useLoadEvents(): { loading: boolean; loadedAt: string | null } {
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.events.list.length);
  const loading = useAppSelector((state) => state.events.loading);
  const loadedAt = useAppSelector((state) => state.events.loadedAt);

  useEffect(() => {
    if (loading || count > 0 || loadedAt) return;
    void dispatch(fetchEvents());
  }, [dispatch, loading, count, loadedAt]);

  return { loading, loadedAt };
}

export default useLoadEvents;
