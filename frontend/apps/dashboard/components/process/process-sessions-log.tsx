'use client';

import { CalendarClock } from 'lucide-react';
import moment from 'moment';

import { cn } from '@feature/ui/lib/ui/utils';
import type { InterviewSession } from '@feature/base/server';
import { ProcessSessionCard } from '@app/dashboard/components/session/process-session-card';

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
      <div className="rounded-md border bg-card">
        {orderedSessions.length > 0 ? (
          orderedSessions.map((session, index) => (
            <div key={session.id} className="relative flex gap-3 px-4 py-3">
              {index < orderedSessions.length - 1 ? (
                <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" />
              ) : null}
              <div className="z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                <CalendarClock className="size-3" />
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <ProcessSessionCard session={session} />
              </div>
            </div>
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
