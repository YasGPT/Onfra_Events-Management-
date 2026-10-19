// Redux Thunks for the Events module (GET/POST/PATCH/DELETE /events).
import { createAsyncThunk } from '@reduxjs/toolkit';

import apiClient, { ApiError } from '../../services/apiClient';
import type { CreateEventInput, EventSummary, UpdateEventInput } from '../../types';
import { persistActiveEvent, setActiveEvent } from './activeEventSlice';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Strips blank optional fields so the API does not store empty strings. */
function normaliseEventInput(input: CreateEventInput): CreateEventInput {
  const optional = (value?: string) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed ? trimmed : undefined;
  };

  return {
    name: input.name.trim(),
    description: optional(input.description),
    starts_at: optional(input.starts_at),
    ends_at: optional(input.ends_at),
    timezone: optional(input.timezone),
    venue_name: optional(input.venue_name),
    venue_address: optional(input.venue_address),
    organizer_name: optional(input.organizer_name),
    organizer_email: optional(input.organizer_email),
    organizer_phone: optional(input.organizer_phone),
    meeting_request_expiry_hours: input.meeting_request_expiry_hours ?? 24,
    allow_personal_photo_uploads: input.allow_personal_photo_uploads,
    logo_data: input.logo_data,
    banner_data: input.banner_data,
    logo_asset_id: input.logo_asset_id,
    banner_asset_id: input.banner_asset_id,
    status: input.status,
  };
}

/** All events this admin may access. */
export const fetchEvents = createAsyncThunk<EventSummary[], void, { rejectValue: string }>(
  'events/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiClient.get<EventSummary[]>('/events');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to load events.'));
    }
  },
);

/** Creates an event; published by default or saved as draft. */
export const createEvent = createAsyncThunk<EventSummary, CreateEventInput, { rejectValue: string }>(
  'events/create',
  async (input, { rejectWithValue }) => {
    try {
      return await apiClient.post<EventSummary>('/events', normaliseEventInput(input));
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to create the event.'));
    }
  },
);

/** Updates an existing event. */
export const updateEvent = createAsyncThunk<
  EventSummary,
  { id: string; input: UpdateEventInput },
  { rejectValue: string }
>('events/update', async ({ id, input }, { rejectWithValue }) => {
  try {
    return await apiClient.patch<EventSummary>(`/events/${id}`, input);
  } catch (error) {
    return rejectWithValue(errorMessage(error, 'Unable to update the event.'));
  }
});

/** Deletes a single event. */
export const deleteEvent = createAsyncThunk<string, string, { rejectValue: string }>(
  'events/delete',
  async (eventId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/events/${eventId}`);
      return eventId;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to delete the event.'));
    }
  },
);

/** Deletes multiple events in bulk. */
export const bulkDeleteEvents = createAsyncThunk<string[], string[], { rejectValue: string }>(
  'events/bulkDelete',
  async (eventIds, { rejectWithValue }) => {
    try {
      await apiClient.post('/events/bulk-delete', { eventIds });
      return eventIds;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Unable to delete selected events.'));
    }
  },
);

/** Makes an event the active scope for every event-scoped module. */
export const selectActiveEvent = createAsyncThunk<EventSummary, EventSummary>(
  'events/selectActive',
  async (event, { dispatch }) => {
    dispatch(setActiveEvent(event));
    persistActiveEvent(event);
    return event;
  },
);
