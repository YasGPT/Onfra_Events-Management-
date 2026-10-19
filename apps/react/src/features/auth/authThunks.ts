// Redux Thunks that talk to the Confra backend for the admin session.
import { createAsyncThunk } from '@reduxjs/toolkit';

import apiClient, { ApiError } from '../../services/apiClient';
import { getAccessToken, clearTokens, persistTokens } from '../../services/tokenStorage';
import { clearAttendees } from '../attendees/attendeesSlice';
import { clearActiveEvent, persistActiveEvent } from '../events/activeEventSlice';
import { resetEvents } from '../events/eventsSlice';
import type { AdminPayload, EventContext, EventSummary, LoginResponse, MeResponse, User } from '../../types';
import { logout, setCredentials, setError, setInitializing, setLoading, setProfile } from './authSlice';

export interface LoginCredentials {
  businessCode: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
  event: EventContext | null;
}

function toUser(admin: AdminPayload & { role?: string }): User {
  return {
    id: String(admin.id),
    name: admin.full_name,
    email: admin.email,
    role: admin.role,
    phone: admin.phone ?? null,
  };
}

/**
 * POST /api/v1/auth/admin/login — business code + email + password.
 * On success the tokens are stored and the session goes into Redux.
 */
export const loginWithCredentials = createAsyncThunk<
  AuthSession,
  LoginCredentials,
  { rejectValue: string }
>('auth/loginWithCredentials', async (credentials, { dispatch, rejectWithValue }) => {
  dispatch(setLoading(true));
  dispatch(setError(null));

  try {
    const payload = await apiClient.post<LoginResponse>(
      '/auth/admin/login',
      {
        business_code: credentials.businessCode.trim().toUpperCase(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      },
      { withAuth: false },
    );

    persistTokens(payload.accessToken, payload.refreshToken);

    const session: AuthSession = {
      user: toUser(payload.admin),
      token: payload.accessToken,
      event: payload.event
        ? {
            id: String(payload.event.id),
            name: payload.event.name,
            businessCode: payload.event.business_code,
          }
        : null,
    };

    dispatch(setCredentials({ user: session.user, token: session.token, event: session.event }));
    // A fresh sign-in must not inherit the event scope picked by the previous admin.
    dispatch(clearActiveEvent());
    persistActiveEvent(null);
    return session;
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'Something went wrong while signing in. Please try again.';

    dispatch(setError(message));
    dispatch(setLoading(false));
    return rejectWithValue(message);
  }
});

/**
 * GET /api/v1/auth/me — restores the session after a page refresh.
 */
export const restoreSession = createAsyncThunk<AuthSession | null, void, { rejectValue: string }>(
  'auth/restoreSession',
  async (_, { dispatch, rejectWithValue }) => {
    dispatch(setInitializing(true));

    try {
      const data = await apiClient.get<MeResponse>('/auth/me');
      const decoded = data?.user;

      if (!decoded?.id) {
        throw new ApiError('Session is not valid.', 401);
      }

      const session: AuthSession = {
        user: toUser({
          id: decoded.id,
          full_name: decoded.full_name ?? decoded.email,
          email: decoded.email,
          role: decoded.role,
        }),
        token: getAccessToken() ?? '',
        event: decoded.eventId
          ? {
              id: String(decoded.eventId),
              name: '',
              businessCode: decoded.businessCode ?? '',
            }
          : null,
      };

      // /auth/me only carries the eventId, so ask the events API for its name.
      if (session.event) {
        try {
          const eventDetail = await apiClient.get<EventSummary>(`/events/${session.event.id}`);
          session.event = {
            id: String(eventDetail.id),
            name: eventDetail.name,
            businessCode: eventDetail.business_code || session.event.businessCode,
          };
        } catch {
          // Keep the business code from the token when the event cannot be read.
        }
      }

      dispatch(setProfile({ user: session.user, event: session.event }));
      return session;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to restore your session.';
      clearTokens();
      dispatch(logout());
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

/** Drops the stored tokens, cached module data and the in-memory session. */
export const signOut = createAsyncThunk<void, void>('auth/signOut', async (_, { dispatch }) => {
  clearTokens();
  persistActiveEvent(null);
  dispatch(clearActiveEvent());
  dispatch(resetEvents());
  dispatch(clearAttendees());
  dispatch(logout());
});
