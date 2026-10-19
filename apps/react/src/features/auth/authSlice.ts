import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EventContext, User } from '../../types';
import { getAccessToken } from '../../services/tokenStorage';

export interface AuthState {
  user: User | null;
  event: EventContext | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while a login / profile request is in flight. */
  loading: boolean;
  /** True while the saved session is being restored on first paint. */
  initializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  event: null,
  token: typeof window !== 'undefined' ? getAccessToken() : null,
  isAuthenticated: typeof window !== 'undefined' ? Boolean(getAccessToken()) : false,
  loading: false,
  initializing: typeof window !== 'undefined' ? Boolean(getAccessToken()) : false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; event?: EventContext | null }>
    ) => {
      const { user, token, event = null } = action.payload;
      state.user = user;
      state.token = token;
      state.event = event;
      state.isAuthenticated = true;
      state.loading = false;
      state.initializing = false;
      state.error = null;
    },
    /** Refreshes the profile / active event without touching the stored token. */
    setProfile: (state, action: PayloadAction<{ user: User; event?: EventContext | null }>) => {
      const { user, event = null } = action.payload;
      state.user = user;
      state.event = event;
      state.isAuthenticated = true;
      state.loading = false;
      state.initializing = false;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.event = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.initializing = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCredentials, setProfile, logout, setLoading, setInitializing, setError } =
  authSlice.actions;

export default authSlice.reducer;
