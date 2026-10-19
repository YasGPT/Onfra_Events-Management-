// Central place where the auth tokens live so that both the Redux slice and
// the API client can read them without importing each other.

const ACCESS_TOKEN_KEY = 'confra.accessToken';
const REFRESH_TOKEN_KEY = 'confra.refreshToken';

const hasStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

export function getAccessToken(): string | null {
  return hasStorage() ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

export function getRefreshToken(): string | null {
  return hasStorage() ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function persistTokens(accessToken: string, refreshToken?: string): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
