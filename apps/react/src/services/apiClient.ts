// Backend API connection setup
import { getAccessToken } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** Extra headers merged into the request. */
  headers?: Record<string, string>;
  /** Query string appended to the endpoint. */
  params?: QueryParams;
  /** Set to false for public endpoints such as login. Defaults to true. */
  withAuth?: boolean;
  /** Abort signal for cancellable requests. */
  signal?: AbortSignal;
}

/** Error carrying the HTTP status and the message sent by the Confra API. */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Thrown when the backend (or the dev proxy) could not be reached at all. */
export const NETWORK_ERROR_STATUS = 0;

function buildUrl(endpoint: string, params?: QueryParams): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${path}`;

  if (!params) return url;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

async function readBody(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

function resolveErrorMessage(payload: Record<string, unknown> | null, res: Response): string {
  if (typeof payload?.message === 'string' && payload.message) {
    return payload.message;
  }
  if (res.status === 404) return 'The requested resource was not found.';
  if (res.status === 500) return 'The server failed to process this request.';
  return `Request failed with status ${res.status}.`;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { headers, params, withAuth = true, signal } = options;
  const token = withAuth ? getAccessToken() : null;

  let res: Response;
  try {
    res = await fetch(buildUrl(endpoint, params), {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Unable to reach the Confra API at ${API_BASE_URL}. Is the backend running?`,
      NETWORK_ERROR_STATUS,
    );
  }

  const payload = await readBody(res);
  const succeeded = res.ok && payload?.success !== false;

  if (!succeeded) {
    if (res.status === 401 && withAuth) {
      // Let the auth slice drop the stale session.
      window.dispatchEvent(new CustomEvent('confra:unauthorized'));
    }
    throw new ApiError(resolveErrorMessage(payload, res), res.status, payload?.details);
  }

  // The API wraps everything in { success, message, data }.
  const data = payload && 'data' in payload ? payload.data : payload;
  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>('GET', endpoint, undefined, options),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('POST', endpoint, data, options),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PUT', endpoint, data, options),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>('PATCH', endpoint, data, options),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>('DELETE', endpoint, undefined, options),
};

export default apiClient;
