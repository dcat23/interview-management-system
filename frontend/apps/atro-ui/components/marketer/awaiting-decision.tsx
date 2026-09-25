'use client';

import { useState } from 'react';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, FileTextIcon, UserXIcon, XIcon } from 'lucide-react';
import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import { useTransitionSessionStatus } from '@feature/backend/hooks/session/use-transition-session-status';
import type { InterviewSession, SessionStatus } from '@feature/base/server';
import {
  ActionTable,
  type ActionTableAction,
  type ActionTableColumn,
} from '@app/atro-ui/components/ui/common/action-table';
import { TruncatedCell } from '@app/atro-ui/components/ui/common/truncated-cell';
import { SessionDetailDrawer } from './session-detail-drawer';

const PAGE_SIZE = 10;

function sessionLabel(session: InterviewSession) {
  return `${session.candidateName ?? 'Unknown candidate'} · ${session.round}`;
}

const columns: ActionTableColumn<InterviewSession>[] = [
  {
    id: 'candidate',
    header: 'Candidate',
    cell: (session) => (
      <div className="min-w-0">
        <span className="block truncate font-medium">{session.candidateName ?? 'Unknown candidate'}</span>
        {session.technology && (
          <span className="block truncate text-xs text-muted-foreground">{session.technology}</span>
        )}
      </div>
    ),
  },
  {
    id: 'client',
    header: 'Client',
    className: 'text-sm text-muted-foreground',
    cell: (session) => session.clientName ?? '—',
  },
  {
    id: 'round',
    header: 'Round',
    className: 'text-sm text-muted-foreground',
    cell: (session) => session.round,
  },
  {
    id: 'supporter',
    header: 'Supporter',
    className: 'text-sm text-muted-foreground',
    cell: (session) => session.supporterName ?? '—',
  },
  {
    id: 'date',
    header: 'Date',
    className: 'text-sm text-muted-foreground whitespace-nowrap',
    cell: (session) => (
      <div>
        <span className="block">{moment(session.scheduledAt).format('MMM D, YYYY · h:mm A')}</span>
        {session.statusChangedAt && (
          <span className="block text-xs">In review {moment(session.statusChangedAt).fromNow(true)}</span>
        )}
      </div>
    ),
  },
  {
    id: 'description',
    header: 'Description',
    className: 'max-w-[300px] text-sm text-muted-foreground',
    cell: (session) => <TruncatedCell text={session.description} />,
  },
];

export function AwaitingDecision() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<InterviewSession | null>(null);
  const { data, isLoading } = useSessions({
    page,
    limit: PAGE_SIZE,
    status: 'IN_REVIEW',
    // Oldest decision first — longest-waiting candidates surface at the top.
    sort: 'statusChangedAt,asc',
  });
  const transition = useTransitionSessionStatus();

  const decide = async (session: InterviewSession, targetStatus: SessionStatus) => {
    try {
      await transition.mutateAsync({ sessionId: session.id, targetStatus });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch {
      // The mutation hook already surfaces the error toast.
    }
  };

  const rowActions = (session: InterviewSession): ActionTableAction<InterviewSession>[] => [
    {
      id: 'pass',
      label: 'Pass',
      icon: <CheckIcon className="size-4" />,
      tone: 'success',
      onClick: (row) => decide(row, 'PASSED'),
      confirm: {
        title: 'Mark as passed?',
        description: `${sessionLabel(session)} moves to Passed. This can't be undone.`,
      },
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: <XIcon className="size-4" />,
      tone: 'destructive',
      onClick: (row) => decide(row, 'REJECTED'),
      confirm: {
        title: 'Mark as rejected?',
        description: `${sessionLabel(session)} moves to Rejected. This can't be undone.`,
      },
    },
    {
      id: 'no-show',
      label: 'No-show',
      icon: <UserXIcon className="size-4" />,
      tone: 'warning',
      onClick: (row) => decide(row, 'NO_SHOW'),
      confirm: {
        title: 'Mark as no-show?',
        description: `${sessionLabel(session)} moves to No show.`,
      },
    },
    {
      id: 'view',
      label: 'View details',
      icon: <FileTextIcon className="size-4" />,
      onClick: (row) => setSelected(row),
    },
  ];

  const total = data?.total ?? 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Awaiting decision</h2>
        {!isLoading && total > 0 && <span className="text-sm text-muted-foreground">{total}</span>}
      </div>

      <ActionTable
        columns={columns}
        getRowId={(session) => session.id}
        rowActions={rowActions}
        pageResponse={data}
        onPageChange={setPage}
        isLoading={isLoading}
        skeletonRows={3}
        emptyMessage="Nothing awaiting a decision."
      />

      <SessionDetailDrawer
        session={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        // Keep the drawer open on the updated session so the change shows.
        onSessionChanged={setSelected}
      />
    </section>
  );
}

export default AwaitingDecision;
