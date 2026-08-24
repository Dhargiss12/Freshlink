/**
 * Safely parse a fetch Response as JSON.
 * Returns null if the response is not valid JSON (e.g. HTML error page from proxy).
 */
export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}
