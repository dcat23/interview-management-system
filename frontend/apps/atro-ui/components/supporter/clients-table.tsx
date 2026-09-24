'use client';

import moment from 'moment';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { useClientsPage } from '@feature/backend/hooks/client/use-clients-page';
import type { Client } from '@feature/base/server';
import { DataTable, DataTableColumn } from '@feature/ui/components/ui/common/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/atro-ui/components/ui/common/select';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';
import { useClientsFilterStore } from '@app/atro-ui/stores/clients-filter-store';
import { useProcessesFilterStore } from '@app/atro-ui/stores/processes-filter-store';
import { useSessionsFilterStore } from '@app/atro-ui/stores/sessions-filter-store';

const ALL = 'all';
const ACTIVE = 'active';
const INACTIVE = 'inactive';

interface ActiveBadgeProps {
  active: boolean;
}

function ActiveBadge({ active }: ActiveBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-0',
        active
          ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

const columns: DataTableColumn<Client>[] = [
  {
    id: 'name',
    header: 'Client',
    cell: (client) => client.name,
    sortValue: (client) => client.name,
    sortable: true,
  },
  {
    id: 'industry',
    header: 'Industry',
    cell: (client) => client.industry ?? '—',
    sortValue: (client) => client.industry ?? '',
    sortable: true,
  },
  {
    id: 'active',
    header: 'Status',
    cell: (client) => <ActiveBadge active={client.active} />,
    sortValue: (client) => (client.active ? 1 : 0),
    sortable: true,
  },
  {
    id: 'createdAt',
    header: 'Added',
    cell: (client) => moment(client.createdAt).format('MMM D, YYYY'),
    sortValue: (client) => moment(client.createdAt).valueOf(),
    sortable: true,
  },
];

function toActiveValue(isActive: boolean | undefined) {
  if (isActive === undefined) return ALL;
  return isActive ? ACTIVE : INACTIVE;
}

export function ClientsTable() {
  const page = useClientsFilterStore((state) => state.page);
  const setPage = useClientsFilterStore((state) => state.setPage);
  const limit = useClientsFilterStore((state) => state.limit);
  const setLimit = useClientsFilterStore((state) => state.setLimit);
  const search = useClientsFilterStore((state) => state.search);
  const setSearch = useClientsFilterStore((state) => state.setSearch);
  const isActive = useClientsFilterStore((state) => state.filters.isActive);
  const setFilters = useClientsFilterStore((state) => state.setFilters);
  const sortState = useClientsFilterStore((state) => state.sortState);
  const setSortState = useClientsFilterStore((state) => state.setSortState);
  const resetFilters = useClientsFilterStore((state) => state.reset);
  const setProcessFilters = useProcessesFilterStore((state) => state.setFilters);
  const setSessionFilters = useSessionsFilterStore((state) => state.setFilters);
  const debouncedSearch = useDebouncedValue(search, 400);
  const router = useRouter();

  const { data: pageResponse, isLoading } = useClientsPage({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    isActive,
    sort: sortState ? `${sortState.columnId},${sortState.direction}` : 'name,asc',
  });

  return (
    <DataTable
      pageResponse={pageResponse}
      isLoading={isLoading}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
      columns={columns}
      getRowId={(row) => row.id}
      enableSorting
      sortState={sortState}
      onSortStateChange={setSortState}
      searchPlaceholder="Search clients"
      searchValue={search}
      onSearchValueChange={setSearch}
      toolbarActions={() => (
        <>
          <Select
            value={toActiveValue(isActive)}
            onValueChange={(value) =>
              setFilters({ isActive: value === ALL ? undefined : value === ACTIVE })
            }
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All clients</SelectItem>
              <SelectItem value={ACTIVE}>Active</SelectItem>
              <SelectItem value={INACTIVE}>Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={resetFilters}>
            <span className="sr-only">Reset filters</span>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </>
      )}
      emptyMessage="No clients yet."
      rowActionGroups={(client) => [
        {
          actions: [
            {
              label: 'Details',
              onClick: () => router.push(`/supporter/clients/${client.id}`),
            },
            {
              label: 'View processes',
              onClick: () => {
                setProcessFilters({ clientId: client.id });
                router.push('/supporter/processes');
              },
            },
            {
              label: 'View sessions',
              onClick: () => {
                setSessionFilters({ clientId: client.id });
                router.push('/supporter/sessions');
              },
            },
          ],
        },
      ]}
    />
  );
}

export default ClientsTable;
