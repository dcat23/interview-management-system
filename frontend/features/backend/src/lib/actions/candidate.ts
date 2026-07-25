'use server';

import { withApi } from '@next-feature/client/server';
import api from '../config/client';
import type { Candidate, Page, Pageable } from '@feature/base/server';
import { toRecord } from '@feature/base/server';

/**
 * [get-candidates]
 *
 * ids?: filter to a specific set of candidate ids for batch name resolution
 * (e.g. resolving candidateName across a page of processes/sessions in one call).
 */
export type GetCandidatesRequest = Pageable & {
  ids?: string[];
};

export type GetCandidatesResponse = Page<Candidate>;

export const getCandidates = withApi(
  async (options?: GetCandidatesRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/candidates?' + params.toString();

    return api.get<GetCandidatesResponse>(endpoint);
  },
  {
    fallbackData: { data: [], total: 0, page: 0, limit: 0 },
  },
);

/**
 * [get-candidate-by-id]
 */
export type GetCandidateByIdResponse = Candidate;

export const getCandidateById = withApi(async (id: string) => {
  const endpoint = `/candidates/${id}`;
  return api.get<GetCandidateByIdResponse>(endpoint);
}, {});
