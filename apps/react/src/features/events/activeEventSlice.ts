// The event the admin is currently working inside. Persisted so a page refresh
// keeps the same scope, and every event-scoped module reads it from here.
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { EventSummary } from '../../types';

const STORAGE_KEY = 'confra.activeEvent';

export function readStoredActiveEvent(): EventSummary | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventSummary) : null;
  } catch {
    return null;
  }
}

export function persistActiveEvent(event: EventSummary | null): void {
  if (typeof window === 'undefined') return;
  if (event) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export interface ActiveEventState {
  event: EventSummary | null;
}

const initialState: ActiveEventState = {
  event: readStoredActiveEvent(),
};

export const activeEventSlice = createSlice({
  name: 'activeEvent',
  initialState,
  reducers: {
    setActiveEvent: (state, action: PayloadAction<EventSummary>) => {
      state.event = action.payload;
    },
    clearActiveEvent: (state) => {
      state.event = null;
    },
  },
});

export const { setActiveEvent, clearActiveEvent } = activeEventSlice.actions;

export default activeEventSlice.reducer;
