'use client';

import moment from 'moment';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import { useClients } from '@feature/backend/hooks/client/use-clients';
import type { InterviewProcess, ProcessStatus } from '@feature/base/server';
import { DataTable, DataTableColumn } from '@feature/ui/components/ui/common/data-table';
import { AnimatedCalendar } from '@feature/ui/components/ui/common/calender';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@app/atro-ui/components/ui/common/select';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';
import { useProcessesFilterStore } from '@app/atro-ui/stores/processes-filter-store';
import { PROCESS_STATUS_CONFIG, ProcessStatusBadge } from './process-status-badge';

const ALL_STATUSES = 'all';
const ALL_CLIENTS = 'all';

const columns: DataTableColumn<InterviewProcess>[] = [
  {
    id: 'candidateName',
    header: 'Candidate',
    cell: (process) => process.candidateName ?? 'Unknown candidate',
    sortValue: (process) => process.candidateName ?? '',
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (process) => <ProcessStatusBadge status={process.status} />,
    sortValue: (process) => process.status,
    sortable: true,
  },
  {
    id: 'clientName',
    header: 'Client',
    cell: (process) => process.clientName ?? 'Unknown client',
    sortValue: (process) => process.clientName ?? '',
    sortable: true,
  },
  {
    id: 'round',
    header: 'Round (total)',
    cell: (process) => `${process.currentRound} (${process.sessionCount})`,
    sortValue: (process) => process.currentRound,
    sortable: false,
  },
  {
    id: 'startedAt',
    header: 'Started at',
    cell: (process) => moment(process.startedAt).format('MMM D, YYYY'),
    sortValue: (process) => moment(process.startedAt).valueOf(),
    sortable: true,
  },
];

export function ProcessesTable() {
  const page = useProcessesFilterStore((state) => state.page);
  const setPage = useProcessesFilterStore((state) => state.setPage);
  const limit = useProcessesFilterStore((state) => state.limit);
  const setLimit = useProcessesFilterStore((state) => state.setLimit);
  const search = useProcessesFilterStore((state) => state.search);
  const setSearch = useProcessesFilterStore((state) => state.setSearch);
  const status = useProcessesFilterStore((state) => state.filters.status);
  const clientId = useProcessesFilterStore((state) => state.filters.clientId);
  const setFilters = useProcessesFilterStore((state) => state.setFilters);
  const sortState = useProcessesFilterStore((state) => state.sortState);
  const setSortState = useProcessesFilterStore((state) => state.setSortState);
  const dateRange = useProcessesFilterStore((state) => state.dateRange);
  const setDateRange = useProcessesFilterStore((state) => state.setDateRange);
  const resetFilters = useProcessesFilterStore((state) => state.reset);
  const debouncedSearch = useDebouncedValue(search, 400);
  const router = useRouter();

  const { data: clientsPage } = useClients();

  const { data: pageResponse, isLoading } = useProcesses({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status,
    clientId,
    startedFrom: dateRange?.from ? moment(dateRange.from).format('YYYY-MM-DD') : undefined,
    startedTo: dateRange?.to ? moment(dateRange.to).format('YYYY-MM-DD') : undefined,
    sort: sortState ? `${sortState.columnId},${sortState.direction}` : 'startedAt,desc',
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
      searchPlaceholder="Search processes"
      searchValue={search}
      onSearchValueChange={setSearch}
      toolbarActions={() => (
        <>
          <AnimatedCalendar
            mode="range"
            className="h-8 w-44"
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
          />
          <Select
            value={status ?? ALL_STATUSES}
            onValueChange={(value) =>
              setFilters({
                status: value === ALL_STATUSES ? undefined : (value as ProcessStatus),
              })
            }
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              {Object.entries(PROCESS_STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={clientId ?? ALL_CLIENTS}
            onValueChange={(value) =>
              setFilters({ clientId: value === ALL_CLIENTS ? undefined : value })
            }
          >
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CLIENTS}>All clients</SelectItem>
              {clientsPage?.data.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={resetFilters}>
            <span className="sr-only">Reset filters</span>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </>
      )}
      emptyMessage="No processes yet."
      rowActionGroups={(process) => [
        {
          actions: [
            {
              label: 'Details',
              onClick: () => router.push(`/supporter/processes/${process.id}`),
            },
          ],
        },
      ]}
    />
  );
}

export default ProcessesTable;
