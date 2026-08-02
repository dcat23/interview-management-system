'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import type { InterviewSession, Page, Pageable, SessionStatus } from '@feature/base/server';
import { toRecord } from '@feature/base/server';

/**
 * [get-interview-sessions]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:27:04 pm
 */

export type GetInterviewSessionsRequest = Pageable & {
  status?: SessionStatus;
  processId?: string;
  supporterId?: string;
  search?: string;
  /** yyyy-MM-dd, inclusive - filters on scheduledAt. */
  scheduledFrom?: string;
  /** yyyy-MM-dd, inclusive - filters on scheduledAt. */
  scheduledTo?: string;
  /** e.g. "scheduledAt,asc" - see GET /sessions in the API reference for sortable fields. */
  sort?: string;
};

export type GetInterviewSessionsResponse = Page<InterviewSession>;

export const getInterviewSessions = withApi(
  async (options?: GetInterviewSessionsRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/sessions?' + params.toString();

    return api.get<GetInterviewSessionsResponse>(endpoint);
  },
  {
    fallbackData: {
      data: [],
      total: 0,
      page: 0,
      limit: 0
    }
  },
);

/**
 * [get-sessions-by-process]
 *
 * GET /processes/:id/sessions returns a plain array, not a paginated envelope.
 */
export type GetSessionsByProcessResponse = InterviewSession[];

export const getSessionsByProcess = withApi(async (processId: string) => {
  const endpoint = `/processes/${processId}/sessions`;
  return api.get<GetSessionsByProcessResponse>(endpoint);
}, {
  fallbackData: []
});

/**
 * [get-session-by-id]
 */
export type GetSessionByIdResponse = InterviewSession;

export const getSessionById = withApi(async (id: string) => {
  const endpoint = `/sessions/${id}`;
  return api.get<GetSessionByIdResponse>(endpoint);
}, {});

/**
 * [transition-session-status]
 *
 * PATCH /sessions/:id/status. Applies a status transition through the
 * session's state machine. Permitted roles depend on the from/to pair -
 * 403 if the caller's role isn't permitted, 409 if the transition itself
 * is invalid for the session's current status.
 */
const transitionSessionStatusSchema = z.object({
  targetStatus: z.enum(['SCHEDULED', 'IN_REVIEW', 'PASSED', 'REJECTED', 'NO_SHOW', 'CANCELLED']),
});
export type TransitionSessionStatusRequest = z.infer<typeof transitionSessionStatusSchema>;
export type TransitionSessionStatusResponse = InterviewSession;

export const transitionSessionStatus = withApi(async (sessionId: string, options: TransitionSessionStatusRequest) => {
  const parsed = transitionSessionStatusSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/sessions/${sessionId}/status`;
  return api.patch<TransitionSessionStatusResponse>(endpoint, parsed.data);
}, {});
