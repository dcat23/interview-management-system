'use client';

import { createTableFilterStore } from '@feature/ui/stores/create-table-filter-store';

export interface ClientsTableFilters {
  isActive: boolean | undefined;
}

export const useClientsFilterStore = createTableFilterStore<ClientsTableFilters>({
  isActive: true,
});
