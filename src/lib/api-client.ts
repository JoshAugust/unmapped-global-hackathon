/**
 * API client with static data fallback.
 * When VITE_API_URL is not set or the API is unreachable,
 * falls back to embedded static data for demo mode.
 */

const API = import.meta.env.VITE_API_URL || '';

export async function fetchWithFallback<T>(
  endpoint: string,
  fallbackFn: () => T,
): Promise<T> {
  if (!API) return fallbackFn();
  try {
    const res = await fetch(`${API}${endpoint}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  } catch {
    return fallbackFn();
  }
}
