/**
 * [capitalize]
 * next-feature@0.1.4-2
 * July 30th 2026, 9:46:34 pm
 */
export function capitalize(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.substring(1).toLowerCase();
}
