import { createSlice } from '@reduxjs/toolkit';

import type { Attendee } from '../../types';
import {
  fetchAttendees,
  registerAttendee,
  toggleAttendeeStatus,
} from './attendeesThunks';

export interface AttendeesState {
  items: Attendee[];
  loading: boolean;
  error: string | null;
  /** Flags for the "Register attendee" dialog. */
  registering: boolean;
  registerError: string | null;
  /** Attendee row whose status request is still in flight. */
  updatingId: string | null;
  loadedAt: string | null;
}

const initialState: AttendeesState = {
  items: [],
  loading: false,
  error: null,
  registering: false,
  registerError: null,
  updatingId: null,
  loadedAt: null,
};

function mergeAttendee(state: AttendeesState, attendee: Attendee): void {
  const index = state.items.findIndex((item) => item.id === attendee.id);
  if (index >= 0) {
    state.items[index] = attendee;
  } else {
    state.items.unshift(attendee);
  }
}

export const attendeesSlice = createSlice({
  name: 'attendees',
  initialState,
  reducers: {
    resetRegisterState: (state) => {
      state.registering = false;
      state.registerError = null;
    },
    clearAttendees: (state) => {
      state.items = [];
      state.error = null;
      state.loadedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.loadedAt = new Date().toISOString();
      })
      .addCase(fetchAttendees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load attendees.';
      })
      .addCase(registerAttendee.pending, (state) => {
        state.registering = true;
        state.registerError = null;
      })
      .addCase(registerAttendee.fulfilled, (state, action) => {
        state.registering = false;
        mergeAttendee(state, action.payload);
      })
      .addCase(registerAttendee.rejected, (state, action) => {
        state.registering = false;
        state.registerError = action.payload ?? 'Unable to register the attendee.';
      })
      .addCase(toggleAttendeeStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.attendeeId;
      })
      .addCase(toggleAttendeeStatus.fulfilled, (state, action) => {
        state.updatingId = null;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index].is_active = action.payload.is_active;
      })
      .addCase(toggleAttendeeStatus.rejected, (state) => {
        state.updatingId = null;
      });
  },
});

export const { resetRegisterState, clearAttendees } = attendeesSlice.actions;

export default attendeesSlice.reducer;
