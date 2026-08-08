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
