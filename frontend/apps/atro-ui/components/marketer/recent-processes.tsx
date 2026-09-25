'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { ArrowRightIcon, CalendarPlusIcon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import type { InterviewProcess } from '@feature/base/server';
import {
  ActionTable,
  type ActionTableAction,
  type ActionTableColumn,
} from '@app/atro-ui/components/ui/common/action-table';
import { ProcessStatusBadge } from '@app/atro-ui/components/supporter/process-status-badge';
import { ScheduleSessionDrawer } from './schedule-session-drawer';

const LIMIT = 5;

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
    id: 'status',
    header: 'Status',
    cell: (process) => <ProcessStatusBadge status={process.status} />,
  },
  {
    id: 'sessions',
    header: 'Sessions',
    className: 'text-sm text-muted-foreground',
    cell: (process) =>
      process.sessionCount === 0 ? (
        'None yet'
      ) : (
        <div>
          <span className="block">{process.sessionCount}</span>
          {process.currentRound && <span className="block text-xs">Latest: {process.currentRound}</span>}
        </div>
      ),
  },
  {
    id: 'started',
    header: 'Started',
    className: 'text-sm text-muted-foreground whitespace-nowrap',
    cell: (process) => moment(process.startedAt).format('MMM D, YYYY'),
  },
];

export function RecentProcesses() {
  const router = useRouter();
  const [scheduleFor, setScheduleFor] = useState<InterviewProcess | null>(null);
  const { data, isLoading } = useProcesses({ page: 0, limit: LIMIT, sort: 'createdAt,desc' });

  const rowActions = (): ActionTableAction<InterviewProcess>[] => [
    {
      id: 'schedule',
      label: 'Schedule session',
      icon: <CalendarPlusIcon className="size-4" />,
      onClick: (row) => setScheduleFor(row),
    },
    {
      id: 'view',
      label: 'View process',
      icon: <FileTextIcon className="size-4" />,
      onClick: (row) => router.push(`/marketer/processes/${row.id}`),
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Recent processes</h2>
        <Link
          href="/marketer/processes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          View all
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      <ActionTable
        columns={columns}
        data={data?.data}
        getRowId={(process) => process.id}
        rowActions={rowActions}
        isLoading={isLoading}
        skeletonRows={LIMIT}
        emptyMessage="No processes yet — create one from the header."
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

export default RecentProcesses;
