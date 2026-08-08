'use client';

import { ProcessStatus } from '@feature/base/server';
import { createTableFilterStore } from './create-table-filter-store';

export interface ProcessesTableFilters {
  status: ProcessStatus | undefined;
  clientId: string | undefined;
}

export const useProcessesFilterStore = createTableFilterStore<ProcessesTableFilters>({
  status: undefined,
  clientId: undefined,
});