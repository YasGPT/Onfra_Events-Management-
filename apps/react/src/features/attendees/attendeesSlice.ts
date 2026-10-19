import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Attendee, AttendeeStats } from '../../types';
import {
  approveAttendee,
  bulkApproveAttendees,
  bulkDeleteAttendees,
  bulkPrintBadges,
  bulkRejectAttendees,
  checkInAttendee,
  checkOutAttendee,
  deleteAttendee,
  fetchAttendeeById,
  fetchAttendees,
  fetchAttendeeStats,
  printBadge,
  regenerateQr,
  registerAttendee,
  rejectAttendee,
  resendAttendeeLink,
  toggleAttendeeStatus,
  updateAttendee,
  updateAttendeePrivacy,
} from './attendeesThunks';

export interface AttendeesState {
  items: Attendee[];
  stats: AttendeeStats | null;
  selectedAttendee: Attendee | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  registering: boolean;
  registerError: string | null;
  actionLoading: boolean;
  updatingId: string | null;
  loadedAt: string | null;
  linkBusyId: string | null;
  linkNotice: string | null;
  linkError: string | null;
}

const initialState: AttendeesState = {
  items: [],
  stats: null,
  selectedAttendee: null,
  loading: false,
  statsLoading: false,
  error: null,
  registering: false,
  registerError: null,
  actionLoading: false,
  updatingId: null,
  loadedAt: null,
  linkBusyId: null,
  linkNotice: null,
  linkError: null,
};

function mergeAttendee(state: AttendeesState, attendee: Attendee): void {
  const index = state.items.findIndex((item) => item.id === attendee.id);
  if (index >= 0) {
    state.items[index] = { ...state.items[index], ...attendee };
  } else {
    state.items.unshift(attendee);
  }

  if (state.selectedAttendee?.id === attendee.id) {
    state.selectedAttendee = { ...state.selectedAttendee, ...attendee };
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
      state.stats = null;
      state.selectedAttendee = null;
      state.error = null;
      state.loadedAt = null;
      state.linkNotice = null;
      state.linkError = null;
    },
    setSelectedAttendee: (state, action: PayloadAction<Attendee | null>) => {
      state.selectedAttendee = action.payload;
    },
    clearLinkNotice: (state) => {
      state.linkNotice = null;
      state.linkError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
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

      // Fetch Stats
      .addCase(fetchAttendeeStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchAttendeeStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAttendeeStats.rejected, (state) => {
        state.statsLoading = false;
      })

      // Fetch Single Attendee
      .addCase(fetchAttendeeById.fulfilled, (state, action) => {
        state.selectedAttendee = action.payload;
        mergeAttendee(state, action.payload);
      })

      // Register Attendee
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

      // Update Attendee
      .addCase(updateAttendee.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })

      // Delete Attendee
      .addCase(deleteAttendee.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.selectedAttendee?.id === action.payload) {
          state.selectedAttendee = null;
        }
      })

      // Bulk Delete
      .addCase(bulkDeleteAttendees.fulfilled, (state, action) => {
        const deletedSet = new Set(action.payload);
        state.items = state.items.filter((item) => !deletedSet.has(item.id));
        if (state.selectedAttendee && deletedSet.has(state.selectedAttendee.id)) {
          state.selectedAttendee = null;
        }
      })

      // Approve & Bulk Approve
      .addCase(approveAttendee.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
        state.linkNotice = `Approval link emailed to ${action.payload.email}.`;
        state.linkError = null;
      })
      .addCase(bulkApproveAttendees.fulfilled, (state, action) => {
        const approvedSet = new Set(action.payload);
        state.items.forEach((item) => {
          if (approvedSet.has(item.id)) {
            item.registration_status = 'approved';
            item.is_active = true;
          }
        });
      })

      // Password setup link
      .addCase(resendAttendeeLink.pending, (state, action) => {
        state.linkBusyId = action.meta.arg.attendeeId;
        state.linkNotice = null;
        state.linkError = null;
      })
      .addCase(resendAttendeeLink.fulfilled, (state, action) => {
        state.linkBusyId = null;
        state.linkNotice = action.payload.message;
        const index = state.items.findIndex((item) => item.id === action.payload.attendeeId);
        if (index >= 0) state.items[index].email_verified_at = new Date().toISOString();
      })
      .addCase(resendAttendeeLink.rejected, (state, action) => {
        state.linkBusyId = null;
        state.linkError = action.payload ?? 'Unable to send the setup link.';
      })

      // Reject & Bulk Reject
      .addCase(rejectAttendee.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })
      .addCase(bulkRejectAttendees.fulfilled, (state, action) => {
        const rejectedSet = new Set(action.payload);
        state.items.forEach((item) => {
          if (rejectedSet.has(item.id)) {
            item.registration_status = 'rejected';
            item.is_active = false;
          }
        });
      })

      // Check-in & Check-out
      .addCase(checkInAttendee.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })
      .addCase(checkOutAttendee.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })

      // Badge
      .addCase(printBadge.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })
      .addCase(bulkPrintBadges.fulfilled, (state, action) => {
        const printedSet = new Set(action.payload);
        state.items.forEach((item) => {
          if (printedSet.has(item.id)) {
            item.is_badge_printed = true;
          }
        });
      })

      // QR
      .addCase(regenerateQr.fulfilled, (state, action) => {
        mergeAttendee(state, action.payload);
      })

      // Privacy
      .addCase(updateAttendeePrivacy.fulfilled, (state, action) => {
        if (state.selectedAttendee) {
          state.selectedAttendee.AttendeePrivacySettings = action.payload;
        }
      })

      // Toggle Active Status
      .addCase(toggleAttendeeStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.attendeeId;
      })
      .addCase(toggleAttendeeStatus.fulfilled, (state, action) => {
        state.updatingId = null;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index].is_active = action.payload.is_active;
        if (state.selectedAttendee?.id === action.payload.id) {
          state.selectedAttendee.is_active = action.payload.is_active;
        }
      })
      .addCase(toggleAttendeeStatus.rejected, (state) => {
        state.updatingId = null;
      });
  },
});

export const {
  resetRegisterState,
  clearAttendees,
  setSelectedAttendee,
  clearLinkNotice,
} = attendeesSlice.actions;

export default attendeesSlice.reducer;
