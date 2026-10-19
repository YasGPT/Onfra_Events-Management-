import axiosClient from './axiosClient';
import type {
  Attendee,
  AttendeeStats,
  CreateAttendeeInput,
  UpdateAttendeeInput,
} from '../types';

export interface AttendeeQueryParams {
  status?: 'pending' | 'registered' | 'rejected' | 'all' | string;
  search?: string;
  page?: number;
  limit?: number;
  company?: string;
  job_title?: string;
}

export interface BulkImportSummary {
  total: number;
  imported: number;
  duplicates: number;
  failed: number;
}

export interface BulkImportJob {
  id: string;
  event_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface BulkImportResponse {
  job: BulkImportJob;
  summary: BulkImportSummary;
  rows?: any[];
}

export const attendeesApi = {
  /**
   * List attendees for an event with query filters (status, search, pagination).
   * GET /api/v1/events/:eventId/attendees
   */
  listAttendees: async (
    eventId: string,
    params?: AttendeeQueryParams,
  ): Promise<Attendee[]> => {
    const data = await axiosClient.get<Attendee[], Attendee[]>(
      `/events/${eventId}/attendees`,
      { params },
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get real-time attendee statistics for an event.
   * GET /api/v1/events/:eventId/attendees/stats
   */
  getAttendeeStats: async (eventId: string): Promise<AttendeeStats> => {
    return axiosClient.get<AttendeeStats, AttendeeStats>(
      `/events/${eventId}/attendees/stats`,
    );
  },

  /**
   * Get single attendee profile.
   * GET /api/v1/events/:eventId/attendees/:id
   */
  getAttendee: async (eventId: string, attendeeId: string): Promise<Attendee> => {
    return axiosClient.get<Attendee, Attendee>(
      `/events/${eventId}/attendees/${attendeeId}`,
    );
  },

  /**
   * Admin manually creates an attendee.
   * POST /api/v1/events/:eventId/attendees
   */
  createAttendee: async (
    eventId: string,
    payload: CreateAttendeeInput,
  ): Promise<Attendee> => {
    return axiosClient.post<Attendee, Attendee>(
      `/events/${eventId}/attendees`,
      payload,
    );
  },

  /**
   * Update an existing attendee's profile.
   * PUT /api/v1/events/:eventId/attendees/:id
   */
  updateAttendee: async (
    eventId: string,
    attendeeId: string,
    payload: UpdateAttendeeInput,
  ): Promise<Attendee> => {
    return axiosClient.put<Attendee, Attendee>(
      `/events/${eventId}/attendees/${attendeeId}`,
      payload,
    );
  },

  /**
   * Delete an attendee by ID.
   * DELETE /api/v1/events/:eventId/attendees/:id
   */
  deleteAttendee: async (
    eventId: string,
    attendeeId: string,
  ): Promise<{ success: boolean; message: string }> => {
    return axiosClient.delete(`/events/${eventId}/attendees/${attendeeId}`);
  },

  /**
   * Approve a pending attendee registration.
   * PATCH /api/v1/events/:eventId/attendees/:id/approve
   */
  approveAttendee: async (eventId: string, attendeeId: string): Promise<Attendee> => {
    return axiosClient.patch<Attendee, Attendee>(
      `/events/${eventId}/attendees/${attendeeId}/approve`,
    );
  },

  /**
   * Reject a pending attendee registration with an optional reason.
   * PATCH /api/v1/events/:eventId/attendees/:id/reject
   */
  rejectAttendee: async (
    eventId: string,
    attendeeId: string,
    reason?: string,
  ): Promise<Attendee> => {
    return axiosClient.patch<Attendee, Attendee>(
      `/events/${eventId}/attendees/${attendeeId}/reject`,
      { reason },
    );
  },

  /**
   * Directly reset an attendee's password.
   * POST /api/v1/events/:eventId/attendees/:id/reset-password
   */
  resetPassword: async (
    eventId: string,
    attendeeId: string,
    newPassword?: string,
  ): Promise<{ success: boolean; message: string; password_setup_token?: string }> => {
    return axiosClient.post(
      `/events/${eventId}/attendees/${attendeeId}/reset-password`,
      { new_password: newPassword },
    );
  },

  /**
   * Toggle an attendee's active status.
   * PATCH /api/v1/events/:eventId/attendees/:id/status
   */
  toggleStatus: async (
    eventId: string,
    attendeeId: string,
    isActive: boolean,
  ): Promise<{ id: string; is_active: boolean; message: string }> => {
    return axiosClient.patch(
      `/events/${eventId}/attendees/${attendeeId}/status`,
      { is_active: isActive },
    );
  },

  /**
   * Bulk approve attendees.
   * POST /api/v1/events/:eventId/attendees/bulk-approve
   */
  bulkApprove: async (
    eventId: string,
    attendeeIds: string[],
  ): Promise<{ count: number; message: string }> => {
    return axiosClient.post(`/events/${eventId}/attendees/bulk-approve`, {
      attendeeIds,
    });
  },

  /**
   * Bulk reject attendees.
   * POST /api/v1/events/:eventId/attendees/bulk-reject
   */
  bulkReject: async (
    eventId: string,
    attendeeIds: string[],
    reason?: string,
  ): Promise<{ count: number; message: string }> => {
    return axiosClient.post(`/events/${eventId}/attendees/bulk-reject`, {
      attendeeIds,
      reason,
    });
  },

  /**
   * Bulk delete attendees.
   * POST /api/v1/events/:eventId/attendees/bulk-delete
   */
  bulkDelete: async (
    eventId: string,
    attendeeIds: string[],
  ): Promise<{ count: number; message: string }> => {
    return axiosClient.post(`/events/${eventId}/attendees/bulk-delete`, {
      attendeeIds,
    });
  },

  /**
   * Download the sample CSV template for bulk imports.
   * GET /api/v1/events/:eventId/attendees/bulk-import/template
   */
  downloadImportTemplate: async (eventId: string): Promise<string> => {
    return axiosClient.get(`/events/${eventId}/attendees/bulk-import/template`, {
      responseType: 'text',
    });
  },

  /**
   * Upload CSV for bulk importing attendees.
   * POST /api/v1/events/:eventId/attendees/bulk-import
   * Accepts { csv_content: string }
   */
  uploadBulkImport: async (
    eventId: string,
    csvContent: string,
  ): Promise<BulkImportResponse> => {
    return axiosClient.post<BulkImportResponse, BulkImportResponse>(
      `/events/${eventId}/attendees/bulk-import`,
      { csv_content: csvContent },
    );
  },

  /**
   * List past CSV import jobs for an event.
   * GET /api/v1/events/:eventId/attendees/import-jobs
   */
  listImportJobs: async (eventId: string): Promise<BulkImportJob[]> => {
    const data = await axiosClient.get<BulkImportJob[], BulkImportJob[]>(
      `/events/${eventId}/attendees/import-jobs`,
    );
    return Array.isArray(data) ? data : [];
  },

  /**
   * View details and row breakdown of a specific import job.
   * GET /api/v1/events/:eventId/attendees/import-jobs/:jobId
   */
  getImportJobDetails: async (
    eventId: string,
    jobId: string,
  ): Promise<BulkImportJob & { AttendeeImportRows?: any[] }> => {
    return axiosClient.get(`/events/${eventId}/attendees/import-jobs/${jobId}`);
  },
};

export default attendeesApi;
