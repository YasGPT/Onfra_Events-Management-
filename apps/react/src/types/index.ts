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
  status?: string;
}

/** Payload accepted by `PATCH /api/v1/events/:eventId`. */
export interface UpdateEventInput extends Partial<CreateEventInput> {
  is_active?: boolean;
}


export interface AttendeeCheckIn {
  id: string;
  event_id: string;
  attendee_id: string;
  checked_in_at: string;
  gate_location: string;
  method: 'manual' | 'qr';
}

export interface AttendeeActivityLog {
  id: string;
  event_id: string;
  attendee_id: string;
  action_type: string;
  title: string;
  description?: string;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface AttendeePrivacySetting {
  attendee_id: string;
  field_name: string;
  directory_visible: boolean;
  allow_qr_share: boolean;
}

/** Attendee row from `/events/:eventId/attendees`. */
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
  linkedin_url?: string | null;
  whatsapp_url?: string | null;
  photo_url?: string | null;
  photo_asset_id?: string | null;
  qr_token_hash?: string | null;
  registration_status: 'pending' | 'approved' | 'registered' | 'rejected' | string;
  rejection_reason?: string | null;
  approved_at?: string | null;
  password_setup_token?: string | null;
  password_setup_token_expires_at?: string | null;
  password_setup_at?: string | null;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  check_in_location?: string | null;
  check_in_count: number;
  is_badge_printed: boolean;
  badge_printed_at?: string | null;
  badge_template?: string;
  is_active: boolean;
  registered_at?: string | null;
  /** Set when a password setup link was emailed (reuse of the verified-at column). */
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
  AttendeePrivacySettings?: AttendeePrivacySetting[];
  AttendeeCheckIns?: AttendeeCheckIn[];
  AttendeeActivityLogs?: AttendeeActivityLog[];
}

export interface AttendeeStats {
  total: number;
  pending: number;
  approved: number;
  registered: number;
  rejected: number;
  checkedIn: number;
}

/** `GET /api/v1/public/attendee/setup-link?token=…` – safe details for the create-password screen. */
export interface SetupLinkDetails {
  attendee_id?: string;
  full_name: string;
  email: string;
  already_setup: boolean;
  expires_at?: string | null;
  event?: { id: string; name: string; business_code: string } | null;
}

/** Fields the attendee mobile / public registration form submits. */
export interface PublicRegistrationInput {
  full_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  bio?: string;
  website_url?: string;
  whatsapp_url?: string;
}

/** Payload accepted by `POST /api/v1/events/:eventId/attendees`. */
export interface CreateAttendeeInput {
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  bio?: string;
  website_url?: string;
  linkedin_url?: string;
  whatsapp_url?: string;
  photo_url?: string;
  registration_status?: 'pending' | 'registered' | string;
  badge_template?: string;
}

export interface UpdateAttendeeInput extends Partial<CreateAttendeeInput> {
  is_active?: boolean;
}

/** Backend success envelope. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Exhibitor {
  id: string;
  event_id: string;
  company_name: string;
  booth_number?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  website_url?: string | null;
  description?: string | null;
  logo_url?: string | null;
  status?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

