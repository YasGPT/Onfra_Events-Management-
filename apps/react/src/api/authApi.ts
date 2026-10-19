import axiosClient from './axiosClient';
import type { LoginResponse, MeResponse } from '../types';

export interface AdminLoginCredentials {
  business_code: string;
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
  userType?: 'admin' | 'attendee';
}

export const authApi = {
  /**
   * Admin Login with business_code, email, and password.
   * POST /api/v1/auth/admin/login
   */
  login: async (credentials: AdminLoginCredentials): Promise<LoginResponse> => {
    return axiosClient.post<LoginResponse, LoginResponse>('/auth/admin/login', {
      business_code: credentials.business_code.trim().toUpperCase(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
  },

  /**
   * Refresh authentication token.
   * POST /api/v1/auth/refresh-token
   */
  refreshToken: async (payload: RefreshTokenPayload): Promise<{ accessToken: string }> => {
    return axiosClient.post('/auth/refresh-token', payload);
  },

  /**
   * Admin Logout.
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<{ success: boolean; message: string }> => {
    return axiosClient.post('/auth/logout');
  },

  /**
   * Get authenticated admin profile.
   * GET /api/v1/auth/me
   */
  getProfile: async (): Promise<MeResponse> => {
    return axiosClient.get<MeResponse, MeResponse>('/auth/me');
  },
};

export default authApi;
