'use client';

import { useMemo, useState, type ReactNode } from 'react';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import { useClients } from '@feature/backend/hooks/client/use-clients';
import type { InterviewSession, SessionStatus } from '@feature/base/server';
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
import { useSessionsFilterStore } from '@app/atro-ui/stores/sessions-filter-store';
import { SESSION_STATUS_CONFIG, SessionStatusBadge } from './session-status-badge';
import { SessionDetailDrawer, type SessionDrawerRenderProps } from './session-detail-drawer';

const ALL_STATUSES = 'all';
const ALL_CLIENTS = 'all';
const ALL_ROUNDS = 'all';

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
    cell: (session) => <SessionStatusBadge status={session.status} />,
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

const supporterColumn: DataTableColumn<InterviewSession> = {
  id: 'supporterName',
  header: 'Supporter',
  cell: (session) => session.supporterName ?? '—',
};

interface Props {
  /** Role route prefix for row links, e.g. "/marketer". */
  basePath?: string;
  /** Adds a Supporter column — useful for roles that see everyone's sessions. */
  showSupporter?: boolean;
  /** Drawer shown for "Details"; defaults to the supporter drawer. */
  renderSessionDrawer?: (props: SessionDrawerRenderProps) => ReactNode;
}

export function SessionsTable({ basePath = '/supporter', showSupporter = false, renderSessionDrawer }: Props) {
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
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const { data: clientsPage } = useClients();

  const { data: pageResponse, isLoading } = useSessions({
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    status,
    clientId,
    round,
    scheduledFrom: dateRange?.from ? moment(dateRange.from).format('YYYY-MM-DD') : undefined,
    scheduledTo: dateRange?.to ? moment(dateRange.to).format('YYYY-MM-DD') : undefined,
    sort: sortState ? `${sortState.columnId},${sortState.direction}` : 'scheduledAt,desc',
  });

  // Supporter goes after Client.
  const tableColumns = useMemo(
    () => (showSupporter ? [...columns.slice(0, 4), supporterColumn, ...columns.slice(4)] : columns),
    [showSupporter],
  );

  const roundOptions = useMemo(() => {
    const rounds = new Set<string>();
    pageResponse?.data.forEach((session) => rounds.add(session.round));
    if (round) rounds.add(round);
    return Array.from(rounds).sort();
  }, [pageResponse, round]);

  return (
    <>
      <DataTable
        pageResponse={pageResponse}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        columns={tableColumns}
        getRowId={(row) => row.id}
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
              onValueChange={(value) =>
                setFilters({
                  status: value === ALL_STATUSES ? undefined : (value as SessionStatus),
                })
              }
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {Object.entries(SESSION_STATUS_CONFIG).map(([value, config]) => (
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
            <Select
              value={round ?? ALL_ROUNDS}
              onValueChange={(value) =>
                setFilters({ round: value === ALL_ROUNDS ? undefined : value })
              }
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROUNDS}>All rounds</SelectItem>
                {roundOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
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
        emptyMessage="No sessions yet."
        rowActionGroups={(session) => [
          {
            actions: [
              {
                label: 'Details',
                onClick: () => setSelectedSession(session),
              },
              {
                label: 'View process',
                onClick: () => router.push(`${basePath}/processes/${session.processId}`),
              },
            ],
          },
        ]}
      />

      {renderSessionDrawer ? (
        renderSessionDrawer({
          session: selectedSession,
          onOpenChange: (open) => !open && setSelectedSession(null),
          onSessionChanged: setSelectedSession,
        })
      ) : (
        <SessionDetailDrawer
          session={selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}
    </>
  );
}

export default SessionsTable;
