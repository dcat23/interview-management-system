/**
 * [capitalize]
 * next-feature@0.1.4-2
 * July 30th 2026, 9:46:34 pm
 */
export function capitalize(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.substring(1).toLowerCase();
}

/**
 * [initials]
 * next-feature@0.1.4-2
 * August 1st 2026, 10:46:15 pm
 */
export function initials(data: any) {
  return data;
}

/**
 * [extract-job-id]
 *
 * Mirrors JobIdExtractor on the backend (scheduleimport/JobIdExtractor.java):
 * pulls a requisition code from a trailing parenthetical in a technology
 * string, e.g. "Java Developer (9548BR)" -> "9548BR". The code must contain
 * a digit, so seniority annotations like "Fullstack Engineer(VP)" are ignored.
 */
export function extractJobId(technology: string | null | undefined): string | null {
  const match = technology?.trim().match(/\(([A-Za-z0-9]+)\)\s*$/);
  if (!match || !/\d/.test(match[1])) return null;
  return match[1];
}
