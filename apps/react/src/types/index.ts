// Shared types and interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
