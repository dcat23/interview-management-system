/**
 * [to-url-search-params]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:46:38 pm
 */
export function toUrlSearchParams<T extends object>(data?: T): URLSearchParams {
  const params = new URLSearchParams();
  if (!data) return params;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  return params;
}
