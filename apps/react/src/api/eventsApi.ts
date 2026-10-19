import axiosClient from './axiosClient';
import type { CreateEventInput, EventSummary, UpdateEventInput } from '../types';

export interface EventFeaturesSettings {
  networking: boolean;
  meetings: boolean;
  chat: boolean;
  gallery: boolean;
  exhibitors: boolean;
  sponsors: boolean;
}

export interface EventRegistrationSettings {
  require_admin_approval: boolean;
  allow_public_registration: boolean;
}

export interface EventPrivacySettings {
  directory_visible_default: boolean;
  allow_contact_sharing: boolean;
}

export interface EventMeetingRulesSettings {
  max_duration_minutes: number;
  buffer_minutes: number;
}

export interface EventSettings {
  features: EventFeaturesSettings;
  registration: EventRegistrationSettings;
  privacy: EventPrivacySettings;
  meeting_rules: EventMeetingRulesSettings;
}

export const eventsApi = {
  /**
   * List all events assigned to the logged-in admin's business code.
   * GET /api/v1/events
   */
  listEvents: async (): Promise<EventSummary[]> => {
    const data = await axiosClient.get<EventSummary[], EventSummary[]>('/events');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get single event profile by ID.
   * GET /api/v1/events/:eventId
   */
  getEvent: async (eventId: string): Promise<EventSummary> => {
    return axiosClient.get<EventSummary, EventSummary>(`/events/${eventId}`);
  },

  /**
   * Create a new event.
   * POST /api/v1/events
   */
  createEvent: async (payload: CreateEventInput): Promise<EventSummary> => {
    return axiosClient.post<EventSummary, EventSummary>('/events', payload);
  },

  /**
   * Update event profile details (venue_name, description, starts_at, ends_at, timezone, etc.).
   * PATCH /api/v1/events/:eventId
   */
  updateEvent: async (eventId: string, payload: UpdateEventInput): Promise<EventSummary> => {
    return axiosClient.patch<EventSummary, EventSummary>(`/events/${eventId}`, payload);
  },

  /**
   * Delete an event by ID.
   * DELETE /api/v1/events/:eventId
   */
  deleteEvent: async (eventId: string): Promise<{ success: boolean; message: string }> => {
    return axiosClient.delete(`/events/${eventId}`);
  },

  /**
   * Bulk delete multiple events by ID.
   * POST /api/v1/events/bulk-delete
   */
  bulkDeleteEvents: async (eventIds: string[]): Promise<{ count: number; message: string }> => {
    return axiosClient.post('/events/bulk-delete', { eventIds });
  },

  /**
   * Get event feature toggles & rules (features, registration, privacy, meeting_rules).
   * GET /api/v1/events/:eventId/settings
   */
  getEventSettings: async (eventId: string): Promise<EventSettings> => {
    return axiosClient.get<EventSettings, EventSettings>(`/events/${eventId}/settings`);
  },

  /**
   * Update event feature toggles and registration rules.
   * PUT /api/v1/events/:eventId/settings
   */
  updateEventSettings: async (
    eventId: string,
    settings: Partial<EventSettings>,
  ): Promise<EventSettings> => {
    return axiosClient.put<EventSettings, EventSettings>(`/events/${eventId}/settings`, settings);
  },
};

export default eventsApi;
