// Lightweight system endpoints used to verify the backend connection.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// `/api/v1` -> `/api/health`
const HEALTH_URL = API_BASE_URL.replace(/\/v1\/?$/, '/health');

export interface ApiHealth {
  ok: boolean;
  message: string;
}

/** Pings the shared backend health check; never throws. */
export async function checkApiHealth(): Promise<ApiHealth> {
  try {
    const res = await fetch(HEALTH_URL, { headers: { Accept: 'application/json' } });
    const payload = await res.json().catch(() => null) as { message?: string } | null;

    return {
      ok: res.ok,
      message: res.ok
        ? payload?.message || 'API reachable'
        : `API responded with status ${res.status}`,
    };
  } catch {
    return {
      ok: false,
      message: `Cannot reach ${HEALTH_URL} — start the backend with "npm run dev" in apps/backend`,
    };
  }
}
