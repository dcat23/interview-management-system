'use server';

import { withApi } from '@next-feature/client/server';
import { ApiError } from '../config/client';
import { BACKEND_API_URL } from '../config/env';

export type ImportRowOutcome = 'IMPORTED' | 'UPDATED' | 'FAILED';

export interface ImportRowResult {
  rowNumber: number;
  outcome: ImportRowOutcome;
  candidateId: string | null;
  processId: string | null;
  sessionId: string | null;
  warnings: string[];
  error: string | null;
}

export interface ImportSummaryResponse {
  totalRows: number;
  imported: number;
  updated: number;
  failed: number;
  results: ImportRowResult[];
}

export const importCsv = withApi(async (file: File) => {
  const { auth } = await import('@feature/auth/server');
  const session = await auth();
  const token = session?.user?.jwtToken;

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${BACKEND_API_URL}/imports/interview-schedule`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
  );

  if (!response.ok) {
    const problemDetail = await response.json().catch(() => null);
    throw ApiError.builder()
      .problemDetail(problemDetail ?? undefined)
      .status(response.status)
      .build();
  }

  return response.json() as Promise<ImportSummaryResponse>;
}, {});