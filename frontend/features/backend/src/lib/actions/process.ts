'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import { InterviewProcess, Page, Pageable, ProcessStatus, toRecord } from '@feature/base/server';

/**
 * [get-interview-processes]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:55:10 pm
 */

export type GetInterviewProcessesRequest = Pageable & {
  search?: string;
  status?: ProcessStatus;
  clientId?: string;
  /** yyyy-MM-dd, inclusive - filters on startedAt. */
  startedFrom?: string;
  /** yyyy-MM-dd, inclusive - filters on startedAt. */
  startedTo?: string;
  /** Any SCHEDULED/IN_REVIEW/RESCHEDULED session. false + status ACTIVE = stalled. */
  hasPendingSession?: boolean;
  /** e.g. "candidateName,asc" - see GET /processes in the API reference for sortable fields. */
  sort?: string;
};
export type GetInterviewProcessesResponse = Page<InterviewProcess>;

export const getInterviewProcesses = withApi(
  async (options?: GetInterviewProcessesRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/processes?' + params.toString();

    return api.get<GetInterviewProcessesResponse>(endpoint);
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
 * [get-process-by-id]
 */
export type GetProcessByIdResponse = InterviewProcess;

export const getProcessById = withApi(async (id: string) => {
  const endpoint = `/processes/${id}`;
  return api.get<GetProcessByIdResponse>(endpoint);
}, {});

/**
 * [create-process]
 *
 * POST /processes. Admin and marketer roles only.
 */
const createProcessSchema = z.object({
  candidateId: z.string().uuid(),
  clientId: z.string().uuid(),
  marketerId: z.string().uuid(),
  technology: z.string().trim().min(1),
  jobId: z.string().trim().optional(),
  description: z.string().trim().optional(),
});
export type CreateProcessRequest = z.infer<typeof createProcessSchema>;
export type CreateProcessResponse = InterviewProcess;

export const createProcess = withApi(async (options: CreateProcessRequest) => {
  const parsed = createProcessSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/processes';
  return api.post<CreateProcessResponse>(endpoint, parsed.data);
}, {});

/**
 * [lookup-process-technologies]
 *
 * GET /processes/technologies/lookup. Autocomplete over technologies already
 * in use (free text on the backend). Blank query returns the most-used.
 * Capped at 20.
 */
export const lookupProcessTechnologies = withApi(
  async (query?: string) => {
    const params = new URLSearchParams(toRecord({ query }));
    const endpoint = '/processes/technologies/lookup?' + params.toString();

    return api.get<string[]>(endpoint);
  },
  {
    fallbackData: [],
  },
);

/**
 * [update-process]
 *
 * PATCH /processes/:id. Admin and marketer roles only. Partial — omitted
 * fields are left unchanged.
 */
const updateProcessSchema = z.object({
  technology: z.string().trim().min(1).optional(),
  jobId: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'WITHDRAWN', 'CANCELLED']).optional(),
  /** ISO-8601 instant. */
  closedAt: z.string().datetime().optional(),
});
export type UpdateProcessRequest = z.infer<typeof updateProcessSchema>;
export type UpdateProcessResponse = InterviewProcess;

export const updateProcess = withApi(async (processId: string, options: UpdateProcessRequest) => {
  const parsed = updateProcessSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/processes/${processId}`;
  return api.patch<UpdateProcessResponse>(endpoint, parsed.data);
}, {});
