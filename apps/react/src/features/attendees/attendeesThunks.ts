// Redux Thunks for the Attendees module (`/events/:eventId/attendees`).
import { createAsyncThunk } from '@reduxjs/toolkit';

import apiClient, { ApiError } from '../../services/apiClient';
import type { Attendee, CreateAttendeeInput } from '../../types';

export interface AttendeeListParams {
  eventId: string;
  search?: string;
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
    password: input.password,
    phone: input.phone?.trim() || undefined,
    company_name: input.company_name?.trim() || undefined,
    job_title: input.job_title?.trim() || undefined,
    bio: input.bio?.trim() || undefined,
    website_url: input.website_url?.trim() || undefined,
    whatsapp_url: input.whatsapp_url?.trim() || undefined,
  };
}

/** Admin attendee directory for one event, with optional server-side search. */
export const fetchAttendees = createAsyncThunk<Attendee[], AttendeeListParams, { rejectValue: string }>(
  'attendees/fetchAll',
  async ({ eventId, search }, { rejectWithValue }) => {
    try {
      const data = await apiClient.get<Attendee[]>(`/events/${eventId}/attendees`, {
        params: search ? { search } : undefined,
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load attendees.'));
    }
  },
);

/** Registers an attendee on behalf of the admin (they get a login password). */
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
