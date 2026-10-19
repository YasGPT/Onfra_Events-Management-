import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { EventSummary } from '../../types';
import { createEvent, fetchEvents } from './eventsThunks';

export interface EventsState {
  list: EventSummary[];
  loading: boolean;
  error: string | null;
  /** Separate flags for the "Create event" dialog. */
  saving: boolean;
  saveError: string | null;
  loadedAt: string | null;
}

const initialState: EventsState = {
  list: [],
  loading: false,
  error: null,
  saving: false,
  saveError: null,
  loadedAt: null,
};

function mergeEvent(state: EventsState, event: EventSummary): void {
  const index = state.list.findIndex((item) => item.id === event.id);
  if (index >= 0) {
    state.list[index] = event;
  } else {
    state.list.unshift(event);
  }
}

export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    /** Wipes cached events (used on sign-out so the next admin sees nothing stale). */
    resetEvents: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
      state.saving = false;
      state.saveError = null;
      state.loadedAt = null;
    },
    resetSaveState: (state) => {
      state.saving = false;
      state.saveError = null;
    },
    upsertEvent: (state, action: PayloadAction<EventSummary>) => {
      mergeEvent(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.loadedAt = new Date().toISOString();
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load events.';
      })
      .addCase(createEvent.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.saving = false;
        mergeEvent(state, action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? 'Unable to create the event.';
      });
  },
});

export const { resetEvents, resetSaveState, upsertEvent } = eventsSlice.actions;

export default eventsSlice.reducer;
