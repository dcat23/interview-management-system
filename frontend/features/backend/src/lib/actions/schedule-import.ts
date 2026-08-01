'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';

/**
 * [import-csv]
 * next-feature@0.1.4-2
 * July 31st 2026, 11:03:56 pm
 */
const importCsvSchema = z.object({});
export type ImportCsvRequest = z.infer<typeof importCsvSchema>;
export type ImportCsvResponse = {};

export const importCsv = withApi(async (options?: ImportCsvRequest) => {
  const parsed = importCsvSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/csvs/imports';
  const response = await api.post<ImportCsvResponse>(endpoint, parsed.data);
  return response;
}, {});
