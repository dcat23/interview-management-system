'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarPlusIcon, FileTextIcon, UserMinusIcon } from 'lucide-react';
import { updateProcess } from '@feature/backend/server';
import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import type { InterviewProcess } from '@feature/base/server';
import {
  ActionTable,
  type ActionTableAction,
  type ActionTableColumn,
} from '@app/atro-ui/components/ui/common/action-table';
import { SessionStatusBadge } from '@app/atro-ui/components/supporter/session-status-badge';
import { ScheduleSessionDrawer } from './schedule-session-drawer';

const PAGE_SIZE = 5;

function processLabel(process: InterviewProcess) {
  return `${process.candidateName ?? 'Unknown candidate'} · ${process.clientName ?? 'Unknown client'}`;
}

const columns: ActionTableColumn<InterviewProcess>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    cell: (process) => (
      <div className="min-w-0">
        <span className="block truncate font-medium">{process.candidateName ?? 'Unknown candidate'}</span>
        <span className="block truncate text-xs text-muted-foreground">{process.technology}</span>
      </div>
    ),
  },
  {
    id: 'client',
    header: 'Client',
    className: 'text-sm text-muted-foreground',
    cell: (process) => process.clientName ?? '—',
  },
  {
    id: 'last-session',
    header: 'Last session',
    className: 'text-sm text-muted-foreground',
    cell: (process) =>
      process.lastSessionAt && process.lastSessionStatus ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground">{process.currentRound}</span>
            <SessionStatusBadge status={process.lastSessionStatus} />
          </div>
          <span className="text-xs">{moment(process.lastSessionAt).fromNow()}</span>
        </div>
      ) : (
        'No sessions yet'
      ),
  },
  {
    id: 'started',
    header: 'Started',
    className: 'text-sm text-muted-foreground whitespace-nowrap',
    cell: (process) => moment(process.startedAt).format('MMM D, YYYY'),
  },
];

/**
 * Active processes with no SCHEDULED / IN_REVIEW / RESCHEDULED session —
 * nothing is moving them forward, so they need a next round or closing.
 */
export function StalledProcesses() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [scheduleFor, setScheduleFor] = useState<InterviewProcess | null>(null);

  const { data, isLoading } = useProcesses({
    page,
    limit: PAGE_SIZE,
    status: 'ACTIVE',
    hasPendingSession: false,
    // Longest-running first.
    sort: 'startedAt,asc',
  });

  const withdraw = async (process: InterviewProcess) => {
    const result = await updateProcess(process.id, {
      status: 'WITHDRAWN',
      closedAt: new Date().toISOString(),
    });
    if (!result.success) {
      toast.error(result.message ?? 'Could not withdraw the process. Try again.');
      return;
    }
    toast.success(`Withdrew ${processLabel(process)}`);
    await queryClient.invalidateQueries({ queryKey: ['processes'] });
  };

  const rowActions = (process: InterviewProcess): ActionTableAction<InterviewProcess>[] => [
    {
      id: 'schedule',
      label: 'Schedule session',
      icon: <CalendarPlusIcon className="size-4" />,
      tone: 'success',
      onClick: (row) => setScheduleFor(row),
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: <UserMinusIcon className="size-4" />,
      tone: 'destructive',
      onClick: withdraw,
      confirm: {
        title: 'Withdraw this process?',
        description: `${processLabel(process)} is closed as Withdrawn. Scheduling a new session later reopens it.`,
      },
    },
    {
      id: 'view',
      label: 'View process',
      icon: <FileTextIcon className="size-4" />,
      onClick: (row) => router.push(`/marketer/processes/${row.id}`),
    },
  ];

  const total = data?.total ?? 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Stalled processes</h2>
          {!isLoading && total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
        </div>
        <p className="text-sm text-muted-foreground">Active, but no session scheduled or in review.</p>
      </div>

      <ActionTable
        columns={columns}
        getRowId={(process) => process.id}
        rowActions={rowActions}
        pageResponse={data}
        onPageChange={setPage}
        isLoading={isLoading}
        skeletonRows={3}
        emptyMessage="Every active process has a session in flight."
      />

      <ScheduleSessionDrawer
        open={scheduleFor !== null}
        onOpenChange={(open) => !open && setScheduleFor(null)}
        initialProcess={scheduleFor}
        onScheduled={(session) =>
          toast.success(`${session.round} scheduled for ${session.candidateName ?? 'candidate'}`)
        }
      />
    </section>
  );
}

export default StalledProcesses;
