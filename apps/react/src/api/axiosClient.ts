import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { getAccessToken } from '../services/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorPayload {
  success: boolean;
  status?: string;
  message: string;
  details?: any;
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach Bearer token
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap standard { success, message, data } envelope
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // If response is a file download (like blob or text/csv)
    if (response.config.responseType === 'blob' || typeof response.data === 'string') {
      return response.data;
    }

    // Standard backend envelope: return data directly if present
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }

    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('confra:unauthorized'));
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred while communicating with the server.';

    return Promise.reject(new Error(message));
  },
);

export default axiosClient;
