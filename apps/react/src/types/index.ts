// Shared types and interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string | null;
}

/** Event the admin is currently scoped to, returned by the login/session APIs. */
export interface EventContext {
  id: string;
  name: string;
  businessCode: string;
}

/** Admin-facing shape of an event row from `GET /events`. */
export interface EventSummary {
  id: string;
  name: string;
  business_code: string;
  description?: string | null;
  status?: string;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  timezone?: string;
  venue_name?: string | null;
  venue_address?: string | null;
  organizer_name?: string | null;
  organizer_email?: string | null;
  organizer_phone?: string | null;
  meeting_request_expiry_hours?: number;
  allow_personal_photo_uploads?: boolean;
  logo_asset_id?: string | null;
  banner_asset_id?: string | null;
}

export interface MediaUploadPayload {
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes?: number;
}

/** Raw shape returned by the backend for the authenticated admin. */
export interface AdminPayload {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

/** `POST /auth/admin/login` response body (`data`). */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminPayload;
  event?: { id: string; name: string; business_code: string } | null;
}

/** `GET /auth/me` response body (`data`) — the decoded JWT payload. */
export interface MeResponse {
  user: AdminPayload & {
    userType?: string;
    eventId?: string;
    businessCode?: string;
  };
}

/** Payload accepted by `POST /api/v1/events`. */
export interface CreateEventInput {
  name: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  venue_name?: string;
  venue_address?: string;
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string;
  meeting_request_expiry_hours?: number;
  allow_personal_photo_uploads?: boolean;
  logo_data?: MediaUploadPayload;
  banner_data?: MediaUploadPayload;
  logo_asset_id?: string;
  banner_asset_id?: string;
}

/** Attendee row from `GET /api/v1/events/:eventId/attendees` (no password hash). */
export interface Attendee {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  bio?: string | null;
  website_url?: string | null;
  whatsapp_url?: string | null;
  registration_status?: string;
  is_active: boolean;
  registered_at?: string | null;
  created_at?: string;
}

/** Payload accepted by `POST /api/v1/events/:eventId/attendees`. */
export interface CreateAttendeeInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  bio?: string;
  website_url?: string;
  whatsapp_url?: string;
}

/** Backend success envelope. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
