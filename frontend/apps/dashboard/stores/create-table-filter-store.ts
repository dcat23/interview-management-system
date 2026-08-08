'use client';

import { create } from 'zustand';
import type { DataTableSortState } from '@app/dashboard/components/ui/common/data-table';

export type DataTableDateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export interface TableFilterState<TFilters> {
  page: number;
  limit: number;
  search: string;
  sortState: DataTableSortState;
  dateRange: DataTableDateRange | undefined;
  filters: TFilters;
}

export interface TableFilterActions<TFilters> {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSortState: (sortState: DataTableSortState) => void;
  setDateRange: (dateRange: DataTableDateRange | undefined) => void;
  setFilters: (patch: Partial<TFilters>) => void;
  reset: () => void;
}

export type TableFilterStore<TFilters> = TableFilterState<TFilters> &
  TableFilterActions<TFilters>;

/**
 * Creates a zustand store for a single data table's filter/search/sort/page
 * criteria. State lives in memory only (no persistence), so it survives
 * navigating to a detail page and back (component unmount/remount within
 * the same session) but resets on a full page reload.
 */
export function createTableFilterStore<TFilters extends object>(
  defaultFilters: TFilters,
  defaultLimit = 10,
) {
  const initialState: TableFilterState<TFilters> = {
    page: 0,
    limit: defaultLimit,
    search: '',
    sortState: null,
    dateRange: undefined,
    filters: defaultFilters,
  };

  return create<TableFilterStore<TFilters>>((set) => ({
    ...initialState,

    setPage: (page) => set({ page }),

    setLimit: (limit) => set({ limit, page: 0 }),

    setSearch: (search) => set({ search, page: 0 }),

    setSortState: (sortState) => set({ sortState, page: 0 }),

    setDateRange: (dateRange) => set({ dateRange, page: 0 }),

    setFilters: (patch) =>
      set((state) => ({
        filters: { ...state.filters, ...patch },
        page: 0,
      })),

    reset: () => set(initialState),
  }));
}