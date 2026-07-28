import { NavItem } from '../types/nav';

/**
 * [to-record]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:07:10 pm
 */
export function toRecord<T extends object>(data?: T): Record<string, string> {
  const record: Record<string, string> = {};
  if (!data) return record;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      record[key] = String(value);
    }
  }

  return record;
}

// Picks the longest-href match rather than the first, so a base route like
// "/supporter" doesn't shadow more specific sibling routes like
// "/supporter/sessions" that also prefix-match against it.
export function getCurrentPage(pathname: string, navigation: NavItem[]): NavItem | null {
  let match: NavItem | null = null;
  for (const item of navigation) {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      if (!match || item.href.length > match.href.length) {
        match = item;
      }
    }
  }
  return match;
}
