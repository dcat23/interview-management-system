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
  SCHEDULED: ['SCHEDULED', 'IN_REVIEW', 'CANCELLED', 'RESCHEDULED'],
  IN_REVIEW: ['IN_REVIEW', 'PASSED', 'REJECTED', 'NO_SHOW', 'CANCELLED'],
  PASSED: ['PASSED'],
  REJECTED: ['REJECTED'],
  NO_SHOW: ['NO_SHOW', 'IN_REVIEW', 'CANCELLED', 'RESCHEDULED'],
  CANCELLED: ['CANCELLED'],
  RESCHEDULED: ['RESCHEDULED', 'IN_REVIEW', 'CANCELLED'],
};

/**
 * Statuses the MARKETER role may reschedule from (POST /sessions/:id/reschedule),
 * which marks the session RESCHEDULED and books a replacement. Kept out of
 * MARKETER_SESSION_TRANSITIONS because it isn't a plain status change.
 */
export const MARKETER_RESCHEDULABLE_STATUSES: SessionStatus[] = ['SCHEDULED', 'NO_SHOW', 'RESCHEDULED'];

/**
 * Transitions the MARKETER role may apply, per SessionStatusTransitionService
 * .ALLOWED_TRANSITIONS on the backend. Unlike SESSION_STATUS_TRANSITIONS this
 * excludes the current status and anything reserved for other roles
 * (e.g. SCHEDULED -> IN_REVIEW is supporter-only).
 */
export const MARKETER_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  SCHEDULED: ['CANCELLED'],
  IN_REVIEW: ['PASSED', 'REJECTED', 'NO_SHOW', 'CANCELLED'],
  PASSED: [],
  REJECTED: [],
  NO_SHOW: ['CANCELLED'],
  CANCELLED: [],
  RESCHEDULED: ['CANCELLED'],
};
