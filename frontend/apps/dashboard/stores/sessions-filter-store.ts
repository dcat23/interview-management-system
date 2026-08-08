'use client';

import { SessionStatus } from '@feature/base/server';
import { createTableFilterStore } from './create-table-filter-store';

export interface SessionsTableFilters {
  status: SessionStatus | undefined;
}

export const useSessionsFilterStore = createTableFilterStore<SessionsTableFilters>({
  status: undefined,
});