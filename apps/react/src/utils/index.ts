// Shared constants and validation helpers

export const API_ENDPOINTS = {
  AUTH: '/auth',
  EVENTS: '/events',
  ATTENDEES: '/attendees',
  EXHIBITORS: '/exhibitors',
  SPONSORS: '/sponsors',
  AGENDA: '/agenda',
  USERS: '/users',
  GALLERY: '/gallery',
  ANNOUNCEMENTS: '/announcements',
  REPORTS: '/reports',
} as const;

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
