'use client';

import { useMemo } from 'react';
import moment from 'moment';

import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import { useClients } from '@feature/backend/hooks/client/use-clients';
import { useDebouncedValue } from '@app/dashboard/hooks/ui/use-debounced-value';
import { useSessionsFilterStore } from '@app/dashboard/stores/sessions-filter-store';
import { cn } from '@feature/ui/lib/ui/utils';
import { InterviewSession, SessionStatus } from '@feature/base/server';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Button } from '@feature/ui/components/ui/common/button';
import { Combobox } from '../combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@feature/ui/components/ui/common/select';
import { DataTable, DataTableColumn } from '../ui/common/data-table';
import { useRouter } from 'next/navigation';
import { AnimatedCalendar } from '@feature/ui/components/ui/common/calender';
import { RefreshCw } from 'lucide-react';

const ALL_STATUSES = 'all';
const ALL_CLIENTS = 'all';

const statusConfig: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    className:
      'bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  IN_REVIEW: {
    label: 'In review',
    className:
      'bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  PASSED: {
    label: 'Passed',
    className:
      'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    className:
      'bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  },
  NO_SHOW: {
    label: 'No show',
    className:
      'bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className:
      'bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    className:
      'bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  },
};

function StatusBadge({ status }: { status: SessionStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
  );
}

const columns: DataTableColumn<InterviewSession>[] = [
  {
    id: 'candidateName',
    header: 'Candidate',
    cell: (session) => session.candidateName ?? 'Unknown candidate',
    sortValue: (session) => session.candidateName ?? '',
    sortable: true,
  },
  {
    id: 'round',
    header: 'Round',
    cell: (session) => session.round,
    sortValue: (session) => session.round,
    sortable: true,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (session) => <StatusBadge status={session.status} />,
    sortValue: (session) => session.status,
    sortable: true,
  },
  {
    id: 'clientName',
    header: 'Client',
    cell: (session) => session.clientName ?? 'Unknown client',
    sortValue: (session) => session.clientName ?? '',
    sortable: true,
  },
  {
    id: 'scheduledAt',
    header: 'Scheduled at',
    cell: (session) => moment(session.scheduledAt).format('MMM D, YYYY h:mm A'),
    sortValue: (session) => moment(session.scheduledAt).valueOf(),
    sortable: true,
  },
];

export function SessionsData() {
  const page = useSessionsFilterStore((state) => state.page);
  const setPage = useSessionsFilterStore((state) => state.setPage);
  const limit = useSessionsFilterStore((state) => state.limit);
  const setLimit = useSessionsFilterStore((state) => state.setLimit);
  const search = useSessionsFilterStore((state) => state.search);
  const setSearch = useSessionsFilterStore((state) => state.setSearch);
  const status = useSessionsFilterStore((state) => state.filters.status);
  const clientId = useSessionsFilterStore((state) => state.filters.clientId);
  const round = useSessionsFilterStore((state) => state.filters.round);
  const setFilters = useSessionsFilterStore((state) => state.setFilters);
  const sortState = useSessionsFilterStore((state) => state.sortState);
  const setSortState = useSessionsFilterStore((state) => state.setSortState);
  const dateRange = useSessionsFilterStore((state) => state.dateRange);
  const setDateRange = useSessionsFilterStore((state) => state.setDateRange);
  const resetFilters = useSessionsFilterStore((state) => state.reset);
  const debouncedSearch = useDebouncedValue(search, 400);
  const router = useRouter();

  const { data: clientsPage } = useClients();

  const { data: pageResponse, isLoading } = useSessions({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status,
    clientId,
    round,
    scheduledFrom: dateRange?.from
      ? moment(dateRange.from).format('YYYY-MM-DD')
      : undefined,
    scheduledTo: dateRange?.to
      ? moment(dateRange.to).format('YYYY-MM-DD')
      : undefined,
    sort: sortState
      ? `${sortState.columnId},${sortState.direction}`
      : 'scheduledAt,desc',
  });

  const roundOptions = useMemo(() => {
    const rounds = new Set<string>();
    pageResponse?.data.forEach((session) => rounds.add(session.round));
    return Array.from(rounds)
      .sort()
      .map((round) => ({ value: round, label: round }));
  }, [pageResponse]);

  return (
    <section className="min-h-svh w-full bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <DataTable
          pageResponse={pageResponse}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          columns={columns}
          getRowId={(row) => row.id}
          // enableRowSelection
          enableSorting
          sortState={sortState}
          onSortStateChange={setSortState}
          searchPlaceholder="Search sessions"
          searchValue={search}
          onSearchValueChange={setSearch}
          toolbarActions={() => (
            <>
              <AnimatedCalendar
                mode="range"
                className="h-8 w-44"
                value={dateRange}
                onChange={setDateRange}
                placeholder="Date range"
              />
              <Select
                value={status ?? ALL_STATUSES}
                onValueChange={(value) => {
                  setFilters({
                    status:
                      value === ALL_STATUSES
                        ? undefined
                        : (value as SessionStatus),
                  });
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
                  setFilters({
                    clientId: value === ALL_CLIENTS ? undefined : value,
                  });
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
              <Combobox
                className="w-40"
                options={roundOptions}
                value={round}
                onSelect={(value) => setFilters({ round: value })}
                placeholder="Round"
                searchPlaceholder="Search round..."
                emptyMessage="No rounds found."
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={resetFilters}
              >
                <span className="sr-only">Reset filters</span>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          )}
          emptyMessage="No sessions yet."
          rowActionGroups={(session) => [
            {
              actions: [
                {
                  label: 'Details',
                  onClick: () => router.push(`/sessions/${session.id}`),
                },
                {
                  label: 'View process',
                  onClick: () => router.push(`/processes/${session.processId}`),
                },
              ],
            },
          ]}
        />
      </div>
    </section>
  );
}

export default SessionsData;
