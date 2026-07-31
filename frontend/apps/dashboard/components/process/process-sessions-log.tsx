'use client';

import { CalendarClock, ExternalLink, FileSearch, MoreHorizontal } from 'lucide-react';
import moment from 'moment';
import { redirect } from 'next/navigation';

import { cn } from '@app/dashboard/lib/ui/utils';
import type { InterviewSession, SessionStatus } from '@feature/base/server';
import { Badge } from '../ui/common/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@app/dashboard/components/ui/common/context-menu';

interface Props {
  sessions: InterviewSession[];
  className?: string;
}

const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  IN_REVIEW: {
    label: "In review",
    className: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  PASSED: {
    label: "Passed",
    className: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
  NO_SHOW: {
    label: "No show",
    className: "bg-muted text-muted-foreground",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export function ProcessSessionsLog({ sessions, className }: Props) {
  const orderedSessions = [...sessions].sort(
    (a, b) => moment(b.scheduledAt).valueOf() - moment(a.scheduledAt).valueOf()
  );

  return (
    <div className={cn('grid gap-3', className)}>
      <div className={'rounded-md border bg-card'}>
        {orderedSessions.length > 0 ? (
          orderedSessions.map((session, index) => {
            const status = statusConfig[session.status];
            return (
              <ContextMenu key={session.id}>
                <ContextMenuTrigger asChild>
                  <div
                    key={session.id}
                    className="relative flex gap-3 px-4 py-3"
                  >
                    {index < orderedSessions.length - 1 ? (
                      <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" />
                    ) : null}
                    <div className="z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                      <CalendarClock className="size-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {session.round}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {moment(session.scheduledAt).format(
                            'MMM D, YYYY · h:mm A',
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {session.mode} &middot; {session.durationMinutes} min
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={cn('border-0', status.className)}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-44">
                  <ContextMenuItem onSelect={() => redirect(`/sessions/${session.id}`)}>
                    <ExternalLink />
                    Open record
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <FileSearch />
                    Review change
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <MoreHorizontal />
                    Copy record ID
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No sessions scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcessSessionsLog;
