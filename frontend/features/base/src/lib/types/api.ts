/**
 * [page]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:27:51 pm
 *
 * Matches PageResponse<T> on the backend (common/dto/PageResponse.java).
 */
export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * [pageable]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:40:21 pm
 *
 * Query params accepted by paginated list endpoints (e.g. GET /sessions).
 */
export interface Pageable {
  page?: number;
  limit?: number;
}
