'use client';

import { useState } from 'react';
import moment from 'moment';

import { useSessions } from '@app/dashboard/hooks/session/use-sessions';
import { useDebouncedValue } from '@app/dashboard/hooks/ui/use-debounced-value';
import { cn } from '@feature/ui/lib/ui/utils';
import { InterviewSession, SessionStatus } from '@feature/base/server';
import { Badge } from '@feature/ui/components/ui/common/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@feature/ui/components/ui/common/select';
import { DataTable, DataTableColumn, DataTableSortState } from '../ui/common/data-table';
import { useRouter } from 'next/navigation';
import { AnimatedCalendar } from '@feature/ui/components/ui/common/calender';

const DEFAULT_PAGE_SIZE = 10;
const ALL_STATUSES = 'all';

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
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SessionStatus | undefined>(undefined);
  const [sortState, setSortState] = useState<DataTableSortState>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>();
  const debouncedSearch = useDebouncedValue(search, 400);
  const router = useRouter();

  const { data: pageResponse, isLoading } = useSessions({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status,
    scheduledFrom: dateRange?.from
      ? moment(dateRange.from).format('YYYY-MM-DD')
      : undefined,
    scheduledTo: dateRange?.to
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
          searchPlaceholder="Search sessions"
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
                      : (value as SessionStatus),
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
