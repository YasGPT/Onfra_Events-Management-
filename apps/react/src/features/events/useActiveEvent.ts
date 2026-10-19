// Single source of truth for "which event am I working inside".
import { useAppSelector } from '../../app/hooks';

export interface ActiveEventScope {
  id: string;
  name: string;
  businessCode: string;
}

/**
 * Prefers the event the admin explicitly switched to (persisted in localStorage)
 * and falls back to the event the login session was issued for.
 */
export function useActiveEvent(): ActiveEventScope | null {
  const stored = useAppSelector((state) => state.activeEvent.event);
  const sessionEvent = useAppSelector((state) => state.auth.event);

  if (stored) {
    return { id: stored.id, name: stored.name, businessCode: stored.business_code };
  }

  return sessionEvent ?? null;
}

export default useActiveEvent;
