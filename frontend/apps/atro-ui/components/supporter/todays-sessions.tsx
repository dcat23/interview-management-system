'use client';

import { useState } from 'react';
import moment from 'moment';
import { CalendarClockIcon } from 'lucide-react';
import type { InterviewSession } from '@feature/base/server';

import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/atro-ui/components/ui/common/card';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import { SessionStatusBadge } from './session-status-badge';
import { SessionDetailDrawer } from './session-detail-drawer';

function todayParam() {
  return moment().format('YYYY-MM-DD');
}

export function TodaysSessions() {
  const today = todayParam();
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const { data: pageResponse, isLoading } = useSessions({
    page: 0,
    limit: 100,
    scheduledFrom: today,
    scheduledTo: today,
    sort: 'scheduledAt,asc',
  });

  const sessions = pageResponse?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s sessions</CardTitle>
        <CardDescription>{moment().format('dddd, MMMM D, YYYY')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            <CalendarClockIcon className="h-5 w-5" />
            No sessions scheduled for today.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  className="flex w-full flex-col gap-3 rounded-lg border border-border/50 p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex min-w-14 flex-col items-start">
                      <span className="font-mono text-sm font-medium">
                        {moment(session.scheduledAt).format('h:mm A')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.durationMinutes} min
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {session.candidateName ?? 'Unknown candidate'}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {session.round} &middot; {session.clientName ?? 'Unknown client'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <SessionStatusBadge status={session.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <SessionDetailDrawer
        session={selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </Card>
  );
}

export default TodaysSessions;
