'use client';

import {
  CalendarClock,
  ExternalLink,
  FileSearch,
  MoreHorizontal,
} from 'lucide-react';
import moment from 'moment';
import { redirect } from 'next/navigation';

import { cn } from '@feature/ui/lib/ui/utils';
import type { InterviewSession } from '@feature/base/server';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@feature/ui/components/ui/common/context-menu';
import { SessionStateToggleCard } from '@app/dashboard/components/session/session-state-toggle-card';

interface Props {
  sessions: InterviewSession[];
  className?: string;
}

export function ProcessSessionsLog({ sessions, className }: Props) {
  const orderedSessions = [...sessions].sort(
    (a, b) => moment(b.scheduledAt).valueOf() - moment(a.scheduledAt).valueOf(),
  );

  return (
    <div className={cn('grid gap-3', className)}>
      <div className={'rounded-md border bg-card'}>
        {orderedSessions.length > 0 ? (
          orderedSessions.map((session, index) => (
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
                    <div className="mt-2">
                      <SessionStateToggleCard session={session} />
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem
                  onSelect={() => redirect(`/sessions/${session.id}`)}
                >
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
          ))
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