'use server';

import { withApi } from '@next-feature/client/server';
import api from '../config/client';
import type { Client, Page, Pageable } from '@feature/base/server';
import { toRecord } from '@feature/base/server';

/**
 * [get-clients]
 */
export type GetClientsRequest = Pageable & {
  isActive?: boolean;
  search?: string;
  /** e.g. "name,asc" - see GET /clients in the API reference for sortable fields. */
  sort?: string;
};

export type GetClientsResponse = Page<Client>;

export const getClients = withApi(
  async (options?: GetClientsRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/clients?' + params.toString();

    return api.get<GetClientsResponse>(endpoint);
  },
  {
    fallbackData: { data: [], total: 0, page: 0, limit: 0 },
  },
);