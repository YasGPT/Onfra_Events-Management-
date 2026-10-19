import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { EventSummary } from '../../types';
import { bulkDeleteEvents, createEvent, deleteEvent, fetchEvents, updateEvent } from './eventsThunks';

export interface EventsState {
  list: EventSummary[];
  loading: boolean;
  error: string | null;
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
      // Fetch
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
      // Create
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
      })
      // Update
      .addCase(updateEvent.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.saving = false;
        mergeEvent(state, action.payload);
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? 'Unable to update the event.';
      })
      // Delete
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => item.id !== action.payload);
      })
      // Bulk Delete
      .addCase(bulkDeleteEvents.fulfilled, (state, action) => {
        const deletedSet = new Set(action.payload);
        state.list = state.list.filter((item) => !deletedSet.has(item.id));
      });
  },
});

export const { resetEvents, resetSaveState, upsertEvent } = eventsSlice.actions;

export default eventsSlice.reducer;
