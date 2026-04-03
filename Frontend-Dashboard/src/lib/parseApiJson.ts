/**
 * Read fetch body as JSON. If the server returns HTML (common when the API URL
 * points at the Next app or a 404 page), throw a clear error instead of JSON.parse failing.
 */
export async function parseApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const start = text.trimStart();
  if (start.startsWith("<") || start.startsWith("<!")) {
    throw new Error(
      `Server returned HTML (HTTP ${response.status}), not JSON. Set NEXT_PUBLIC_SYNDICATE_API_URL to your Django backend (https://…up.railway.app/api) and rebuild the frontend so it is available at build time.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from server (HTTP ${response.status}).`);
  }
}
