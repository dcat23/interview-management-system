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
