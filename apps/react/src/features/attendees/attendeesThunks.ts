// Redux Thunks for the Attendees module (`/events/:eventId/attendees`).
import { createAsyncThunk } from '@reduxjs/toolkit';

import apiClient, { ApiError } from '../../services/apiClient';
import type {
  Attendee,
  AttendeePrivacySetting,
  AttendeeStats,
  CreateAttendeeInput,
  UpdateAttendeeInput,
} from '../../types';

export interface AttendeeListParams {
  eventId: string;
  search?: string;
  status?: string;
  company?: string;
  job_title?: string;
  checkInStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface ToggleAttendeeParams {
  eventId: string;
  attendeeId: string;
  isActive: boolean;
}

export interface ToggleAttendeeResult {
  id: string;
  is_active: boolean;
  message: string;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function toPayload(input: CreateAttendeeInput): CreateAttendeeInput {
  return {
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password || undefined,
    phone: input.phone?.trim() || undefined,
    company_name: input.company_name?.trim() || undefined,
    job_title: input.job_title?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    website_url: input.website_url?.trim() || undefined,
    linkedin_url: input.linkedin_url?.trim() || undefined,
    whatsapp_url: input.whatsapp_url?.trim() || undefined,
    photo_url: input.photo_url?.trim() || undefined,
    registration_status: input.registration_status || 'registered',
    badge_template: input.badge_template || 'standard',
  };
}

/** Admin attendee directory for one event, with optional filters. */
export const fetchAttendees = createAsyncThunk<Attendee[], AttendeeListParams, { rejectValue: string }>(
  'attendees/fetchAll',
  async ({ eventId, search, status, company, job_title, checkInStatus, startDate, endDate }, { rejectWithValue }) => {
    try {
      const data = await apiClient.get<Attendee[]>(`/events/${eventId}/attendees`, {
        params: {
          search: search || undefined,
          status: status && status !== 'all' ? status : undefined,
          company: company || undefined,
          job_title: job_title || undefined,
          checkInStatus: checkInStatus && checkInStatus !== 'all' ? checkInStatus : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load attendees.'));
    }
  },
);

/** Fetch real-time statistics for the active event. */
export const fetchAttendeeStats = createAsyncThunk<AttendeeStats, string, { rejectValue: string }>(
  'attendees/fetchStats',
  async (eventId, { rejectWithValue }) => {
    try {
      return await apiClient.get<AttendeeStats>(`/events/${eventId}/attendees/stats`);
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load attendee stats.'));
    }
  },
);

/** Get single attendee profile with activity logs and check-ins. */
export const fetchAttendeeById = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/fetchById', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    return await apiClient.get<Attendee>(`/events/${eventId}/attendees/${attendeeId}`);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to load attendee details.'));
  }
});

/** Registers an attendee on behalf of the admin. */
export const registerAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; input: CreateAttendeeInput },
  { rejectValue: string }
>('attendees/register', async ({ eventId, input }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees`, toPayload(input));
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to register the attendee.'));
  }
});

/** Updates an attendee profile. */
export const updateAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string; input: UpdateAttendeeInput },
  { rejectValue: string }
>('attendees/update', async ({ eventId, attendeeId, input }, { rejectWithValue }) => {
  try {
    return await apiClient.put<Attendee>(`/events/${eventId}/attendees/${attendeeId}`, input);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update the attendee.'));
  }
});

/** Deletes a single attendee. */
export const deleteAttendee = createAsyncThunk<
  string,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/delete', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/events/${eventId}/attendees/${attendeeId}`);
    return attendeeId;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to delete the attendee.'));
  }
});

/** Bulk deletes attendees. */
export const bulkDeleteAttendees = createAsyncThunk<
  string[],
  { eventId: string; attendeeIds: string[] },
  { rejectValue: string }
>('attendees/bulkDelete', async ({ eventId, attendeeIds }, { rejectWithValue }) => {
  try {
    await apiClient.post(`/events/${eventId}/attendees/bulk-delete`, { attendeeIds });
    return attendeeIds;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to delete selected attendees.'));
  }
});

/** Approves a pending attendee. */
export const approveAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/approve', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/approve`);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to approve this attendee.'));
  }
});

/** Bulk approves attendees. */
export const bulkApproveAttendees = createAsyncThunk<
  string[],
  { eventId: string; attendeeIds: string[] },
  { rejectValue: string }
>('attendees/bulkApprove', async ({ eventId, attendeeIds }, { rejectWithValue }) => {
  try {
    await apiClient.post(`/events/${eventId}/attendees/bulk-approve`, { attendeeIds });
    return attendeeIds;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to approve selected attendees.'));
  }
});

/** Result of sending a fresh password setup link. */
export interface ResendLinkResult {
  attendeeId: string;
  message: string;
}

/** Re-sends the password setup link (approved attendees who never created a password). */
export const resendAttendeeLink = createAsyncThunk<
  ResendLinkResult,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/resendLink', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    const result = await apiClient.post<{ message?: string }>(
      `/events/${eventId}/attendees/${attendeeId}/resend-link`,
    );
    return { attendeeId, message: result?.message ?? 'Password setup link sent.' };
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to send the setup link.'));
  }
});

/** Rejects an attendee with an optional reason. */
export const rejectAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string; reason?: string },
  { rejectValue: string }
>('attendees/reject', async ({ eventId, attendeeId, reason }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/reject`, { reason });
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to reject this attendee.'));
  }
});

/** Bulk rejects attendees with an optional reason. */
export const bulkRejectAttendees = createAsyncThunk<
  string[],
  { eventId: string; attendeeIds: string[]; reason?: string },
  { rejectValue: string }
>('attendees/bulkReject', async ({ eventId, attendeeIds, reason }, { rejectWithValue }) => {
  try {
    await apiClient.post(`/events/${eventId}/attendees/bulk-reject`, { attendeeIds, reason });
    return attendeeIds;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to reject selected attendees.'));
  }
});

/** Check in an attendee. */
export const checkInAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string; gate_location?: string; method?: 'manual' | 'qr' },
  { rejectValue: string }
>('attendees/checkIn', async ({ eventId, attendeeId, gate_location, method = 'manual' }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/check-in`, {
      gate_location,
      method,
    });
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to check in attendee.'));
  }
});

/** Check out an attendee. */
export const checkOutAttendee = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/checkOut', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/check-out`);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to check out attendee.'));
  }
});

/** QR Code scanner check-in. */
export const qrCheckIn = createAsyncThunk<
  Attendee,
  { eventId: string; qr_token_hash: string; gate_location?: string },
  { rejectValue: string }
>('attendees/qrCheckIn', async ({ eventId, qr_token_hash, gate_location }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/qr-check-in`, {
      qr_token_hash,
      gate_location,
    });
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'QR check-in failed or attendee not found.'));
  }
});

/** Marks badge printed and sets template. */
export const printBadge = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string; badge_template?: string },
  { rejectValue: string }
>('attendees/printBadge', async ({ eventId, attendeeId, badge_template }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/badge-print`, {
      badge_template,
    });
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to generate badge.'));
  }
});

/** Bulk badge generation. */
export const bulkPrintBadges = createAsyncThunk<
  string[],
  { eventId: string; attendeeIds: string[]; badge_template?: string },
  { rejectValue: string }
>('attendees/bulkPrintBadges', async ({ eventId, attendeeIds, badge_template }, { rejectWithValue }) => {
  try {
    await apiClient.post(`/events/${eventId}/attendees/bulk-badge`, { attendeeIds, badge_template });
    return attendeeIds;
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to generate badges in bulk.'));
  }
});

/** Regenerate QR token for an attendee. */
export const regenerateQr = createAsyncThunk<
  Attendee,
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/regenerateQr', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    return await apiClient.post<Attendee>(`/events/${eventId}/attendees/${attendeeId}/regenerate-qr`);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to regenerate QR code.'));
  }
});

/** Dispatches a custom email or notification to attendee. */
export const sendEmail = createAsyncThunk<
  { success: boolean; message: string },
  { eventId: string; attendeeId: string; subject: string; message: string; type?: string },
  { rejectValue: string }
>('attendees/sendEmail', async ({ eventId, attendeeId, subject, message, type }, { rejectWithValue }) => {
  try {
    return await apiClient.post<{ success: boolean; message: string }>(
      `/events/${eventId}/attendees/${attendeeId}/send-email`,
      { subject, message, type },
    );
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to send email.'));
  }
});

/** Bulk dispatch custom email. */
export const bulkSendEmail = createAsyncThunk<
  { success: boolean; message: string },
  { eventId: string; attendeeIds: string[]; subject: string; message: string },
  { rejectValue: string }
>('attendees/bulkSendEmail', async ({ eventId, attendeeIds, subject, message }, { rejectWithValue }) => {
  try {
    return await apiClient.post<{ success: boolean; message: string }>(
      `/events/${eventId}/attendees/bulk-email`,
      { attendeeIds, subject, message },
    );
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to send bulk email.'));
  }
});

/** Resets password token for attendee. */
export const resetPasswordToken = createAsyncThunk<
  { password_setup_token: string; attendee: Attendee },
  { eventId: string; attendeeId: string },
  { rejectValue: string }
>('attendees/resetPassword', async ({ eventId, attendeeId }, { rejectWithValue }) => {
  try {
    return await apiClient.post<{ password_setup_token: string; attendee: Attendee }>(
      `/events/${eventId}/attendees/${attendeeId}/reset-password`,
    );
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to generate password setup token.'));
  }
});

/** Updates privacy settings for an attendee. */
export const updateAttendeePrivacy = createAsyncThunk<
  AttendeePrivacySetting[],
  { eventId: string; attendeeId: string; settings: AttendeePrivacySetting[] },
  { rejectValue: string }
>('attendees/updatePrivacy', async ({ eventId, attendeeId, settings }, { rejectWithValue }) => {
  try {
    return await apiClient.put<AttendeePrivacySetting[]>(
      `/events/${eventId}/attendees/${attendeeId}/privacy`,
      { settings },
    );
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update privacy settings.'));
  }
});

/** Activates or deactivates an attendee account. */
export const toggleAttendeeStatus = createAsyncThunk<
  ToggleAttendeeResult,
  ToggleAttendeeParams,
  { rejectValue: string }
>('attendees/toggleStatus', async ({ eventId, attendeeId, isActive }, { rejectWithValue }) => {
  try {
    return await apiClient.patch<ToggleAttendeeResult>(
      `/events/${eventId}/attendees/${attendeeId}/status`,
      { is_active: isActive },
    );
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update this attendee.'));
  }
});
