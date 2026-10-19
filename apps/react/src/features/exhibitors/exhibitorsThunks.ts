// Redux Thunks for Exhibitors module
import { createAsyncThunk } from '@reduxjs/toolkit';

import apiClient, { ApiError } from '../../services/apiClient';
import { setLoading, setError, setExhibitors, setStats, type Exhibitor, type ExhibitorsState } from './exhibitorsSlice';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const fetchExhibitors = createAsyncThunk<Exhibitor[], void, { rejectValue: string }>(
  'exhibitors/fetchAll',
  async (_, { dispatch, rejectWithValue, getState }) => {
    dispatch(setLoading());
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const data = await apiClient.get<Exhibitor[]>(`/events/${eventId}/commercial/exhibitors`);
      dispatch(setExhibitors(Array.isArray(data) ? data : []));
      return data;
    } catch (error) {
      const message = errorMessage(error, 'Unable to load exhibitors.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

export const fetchExhibitorStats = createAsyncThunk<ExhibitorsState['stats'], void, { rejectValue: string }>(
  'exhibitors/fetchStats',
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const data = await apiClient.get<ExhibitorsState['stats']>(
        `/events/${eventId}/commercial/exhibitors/stats`
      );
      dispatch(setStats(data));
      return data;
    } catch (error) {
      const message = errorMessage(error, 'Unable to load exhibitor statistics.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

export const createExhibitor = createAsyncThunk<Exhibitor, any, { rejectValue: string }>(
  'exhibitors/create',
  async (exhibitorData, { dispatch, rejectWithValue, getState }) => {
    dispatch(setLoading());
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const data = await apiClient.post<Exhibitor>(
        `/events/${eventId}/commercial/exhibitors`,
        exhibitorData
      );
      return data;
    } catch (error) {
      const message = errorMessage(error, 'Unable to create exhibitor.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

export const updateExhibitor = createAsyncThunk<Exhibitor, { id: string; data: any }, { rejectValue: string }>(
  'exhibitors/update',
  async ({ id, data }, { dispatch, rejectWithValue, getState }) => {
    dispatch(setLoading());
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const result = await apiClient.put<Exhibitor>(
        `/events/${eventId}/commercial/exhibitors/${id}`,
        data
      );
      return result;
    } catch (error) {
      const message = errorMessage(error, 'Unable to update exhibitor.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

export const deleteExhibitor = createAsyncThunk<{ success: boolean; message: string }, string, { rejectValue: string }>(
  'exhibitors/delete',
  async (id, { dispatch, rejectWithValue, getState }) => {
    dispatch(setLoading());
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const result = await apiClient.delete<{ success: boolean; message: string }>(
        `/events/${eventId}/commercial/exhibitors/${id}`
      );
      return result;
    } catch (error) {
      const message = errorMessage(error, 'Unable to delete exhibitor.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);

export const updateExhibitorStatus = createAsyncThunk<Exhibitor, { id: string; status: string }, { rejectValue: string }>(
  'exhibitors/updateStatus',
  async ({ id, status }, { dispatch, rejectWithValue, getState }) => {
    dispatch(setLoading());
    try {
      const state = getState() as any;
      const activeEvent = state.activeEvent.event || state.auth.event;
      const eventId = activeEvent?.id;
      
      if (!eventId) {
        throw new Error('No active event selected');
      }

      const result = await apiClient.patch<Exhibitor>(
        `/events/${eventId}/commercial/exhibitors/${id}/status`,
        { status }
      );
      return result;
    } catch (error) {
      const message = errorMessage(error, 'Unable to update exhibitor status.');
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  },
);
