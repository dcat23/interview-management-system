'use client';

import { SessionStatus } from '@feature/base/server';
import { createTableFilterStore } from '@feature/ui/stores/create-table-filter-store';

export interface SessionsTableFilters {
  status: SessionStatus | undefined;
  clientId: string | undefined;
  round: string | undefined;
}

export const useSessionsFilterStore = createTableFilterStore<SessionsTableFilters>({
  status: undefined,
  clientId: undefined,
  round: undefined,
});
