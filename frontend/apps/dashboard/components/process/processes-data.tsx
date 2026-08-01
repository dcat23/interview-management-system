'use client';

import { useState } from 'react';
import moment from 'moment';

import { useProcesses } from '@app/dashboard/hooks/process/use-processes';
import { useClients } from '@app/dashboard/hooks/client/use-clients';
import { useDebouncedValue } from '@app/dashboard/hooks/ui/use-debounced-value';
import { cn } from '@app/dashboard/lib/ui/utils';
import { InterviewProcess, ProcessStatus } from '@feature/base/server';
import { Badge } from '../ui/common/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/common/select';
import { DataTable, DataTableColumn, DataTableSortState } from '../data-table';
import { useRouter } from 'next/navigation';
import { AnimatedCalendar } from '@app/dashboard/components/ui/common/calender';

const DEFAULT_PAGE_SIZE = 10;
const ALL_STATUSES = 'all';
const ALL_CLIENTS = 'all';

const statusConfig: Record<
  ProcessStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: 'Active',
    className:
      'bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  COMPLETED: {
    label: 'Completed',
    className:
      'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className:
      'bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  },
};

function StatusBadge({ status }: { status: ProcessStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
  );
}

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
    cell: (process) => <StatusBadge status={process.status} />,
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
    id: 'startedAt',
    header: 'Started at',
    cell: (process) => moment(process.startedAt).format('MMM D, YYYY'),
    sortValue: (process) => moment(process.startedAt).valueOf(),
    sortable: true,
  },
];

export function ProcessesData() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProcessStatus | undefined>(undefined);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [sortState, setSortState] = useState<DataTableSortState>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>();
  const debouncedSearch = useDebouncedValue(search, 400);
  const router = useRouter();

  const { data: clientsPage } = useClients();

  const { data: pageResponse, isLoading } = useProcesses({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status,
    clientId,
    startedFrom: dateRange?.from
      ? moment(dateRange.from).format('YYYY-MM-DD')
      : undefined,
    startedTo: dateRange?.to
      ? moment(dateRange.to).format('YYYY-MM-DD')
      : undefined,
    sort: sortState
      ? `${sortState.columnId},${sortState.direction}`
      : undefined,
  });

  return (
    <section className="min-h-svh w-full bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <DataTable
          pageResponse={pageResponse}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(0);
          }}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableSorting
          sortState={sortState}
          onSortStateChange={(nextSortState) => {
            setSortState(nextSortState);
            setPage(0);
          }}
          searchPlaceholder="Search processes"
          searchValue={search}
          onSearchValueChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          toolbarActions={() => (
            <>
              <AnimatedCalendar
                mode="range"
                className="h-8 w-44"
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setPage(0);
                }}
                placeholder="Select date range"
              />
              <Select
                value={status ?? ALL_STATUSES}
                onValueChange={(value) => {
                  setStatus(
                    value === ALL_STATUSES
                      ? undefined
                      : (value as ProcessStatus),
                  );
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position={'item-aligned'}>
                  <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={clientId ?? ALL_CLIENTS}
                onValueChange={(value) => {
                  setClientId(value === ALL_CLIENTS ? undefined : value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent position={'item-aligned'}>
                  <SelectItem value={ALL_CLIENTS}>All clients</SelectItem>
                  {clientsPage?.data.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          emptyMessage="No processes yet."
          rowActionGroups={(process) => [
            {
              actions: [
                {
                  label: 'Details',
                  onClick: () => router.push(`/processes/${process.id}`),
                },
                {
                  label: `View ${process.clientName}`,
                  onClick: () => router.push(`/clients/${process.clientId}`),
                },
              ],
            },
            // {
            //   label: 'Danger zone',
            //   actions: [
            //     {
            //       label: `Delete ${process.id}`,
            //       tone: 'destructive',
            //       onClick: () => (),
            //       confirmKeywordMode: 'random-3-words',
            //     },
            //   ],
            // },
          ]}
        />
      </div>
    </section>
  );
}

export default ProcessesData;
