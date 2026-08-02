import { SessionStatus } from '../types/session';

/**
 * Mirrors SessionStatusTransitionService.ALLOWED_TRANSITIONS on the backend.
 * Terminal statuses map to themselves so the toggle still renders one item.
 *
 * [status-transitions]
 * next-feature@0.1.4-2
 * August 1st 2026, 8:50:20 pm
 */
export const SESSION_STATUS_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  SCHEDULED: ['SCHEDULED', 'IN_REVIEW', 'CANCELLED'],
  IN_REVIEW: ['IN_REVIEW', 'PASSED', 'REJECTED', 'NO_SHOW', 'CANCELLED'],
  PASSED: ['PASSED'],
  REJECTED: ['REJECTED'],
  NO_SHOW: ['NO_SHOW', 'IN_REVIEW', 'CANCELLED'],
  CANCELLED: ['CANCELLED'],
};
