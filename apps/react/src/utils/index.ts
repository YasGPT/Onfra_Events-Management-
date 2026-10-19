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

/** Formats an ISO date/datetime from the API as "12 Mar 2026". */
export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};
