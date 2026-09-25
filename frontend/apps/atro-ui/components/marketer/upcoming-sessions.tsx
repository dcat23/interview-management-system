'use client';

import { useMemo, useState } from 'react';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { BanIcon, CalendarClockIcon, Loader2Icon } from 'lucide-react';
import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import { useTransitionSessionStatus } from '@feature/backend/hooks/session/use-transition-session-status';
import type { InterviewSession } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/atro-ui/components/ui/common/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/atro-ui/components/ui/common/dialog';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/atro-ui/components/ui/common/tooltip';
import { SessionDetailDrawer } from './session-detail-drawer';

const DAYS_AHEAD = 7;

function dayLabel(day: moment.Moment) {
  if (day.isSame(moment(), 'day')) return 'Today';
  if (day.isSame(moment().add(1, 'day'), 'day')) return 'Tomorrow';
  return day.format('dddd, MMM D');
}

export function UpcomingSessions() {
  const queryClient = useQueryClient();
  const transition = useTransitionSessionStatus();
  const [selected, setSelected] = useState<InterviewSession | null>(null);
  const [cancelling, setCancelling] = useState<InterviewSession | null>(null);

  const from = moment().format('YYYY-MM-DD');
  const to = moment().add(DAYS_AHEAD - 1, 'days').format('YYYY-MM-DD');

  const { data, isLoading } = useSessions({
    page: 0,
    limit: 100,
    status: 'SCHEDULED',
    scheduledFrom: from,
    scheduledTo: to,
    sort: 'scheduledAt,asc',
  });

  // Group by local calendar day; the query is already sorted so order holds.
  const groups = useMemo(() => {
    const byDay = new Map<string, InterviewSession[]>();
    for (const session of data?.data ?? []) {
      const key = moment(session.scheduledAt).format('YYYY-MM-DD');
      byDay.set(key, [...(byDay.get(key) ?? []), session]);
    }
    return [...byDay.entries()].map(([key, sessions]) => ({ day: moment(key), sessions }));
  }, [data]);

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await transition.mutateAsync({ sessionId: cancelling.id, targetStatus: 'CANCELLED' });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setCancelling(null);
    } catch {
      // The mutation hook already surfaces the error toast.
    }
  };

  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          Upcoming sessions
          {!isLoading && total > 0 && <span className="text-sm font-normal text-muted-foreground">{total}</span>}
        </CardTitle>
        <CardDescription>Scheduled for the next {DAYS_AHEAD} days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            <CalendarClockIcon className="h-5 w-5" />
            Nothing scheduled in the next {DAYS_AHEAD} days.
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex flex-col gap-5">
              {groups.map(({ day, sessions }) => (
                <section key={day.format('YYYY-MM-DD')} className="flex flex-col gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {dayLabel(day)} &middot; {sessions.length}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {sessions.map((session) => (
                      <li
                        key={session.id}
                        className="flex items-center gap-2 rounded-lg border border-border/50 transition-colors hover:border-primary/30 hover:bg-muted/50"
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(session)}
                          className="flex min-w-0 flex-1 items-start gap-4 p-4 text-left"
                        >
                          <div className="flex min-w-16 flex-col items-start">
                            <span className="font-mono text-sm font-medium">
                              {moment(session.scheduledAt).format('h:mm A')}
                            </span>
                            <span className="text-xs text-muted-foreground">{session.durationMinutes} min</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{session.candidateName ?? 'Unknown candidate'}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {session.round} &middot; {session.clientName ?? 'Unknown client'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {session.supporterName ?? 'No supporter'} &middot; {session.mode}
                            </p>
                          </div>
                        </button>
                        <div className="pr-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                aria-label="Cancel session"
                                className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                                onClick={() => setCancelling(session)}
                                size="icon"
                                variant="outline"
                              >
                                <BanIcon className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel session</TooltipContent>
                          </Tooltip>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>

      <Dialog open={cancelling !== null} onOpenChange={(open) => !open && !transition.isPending && setCancelling(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel session?</DialogTitle>
            {cancelling && (
              <DialogDescription>
                {cancelling.candidateName ?? 'Unknown candidate'} &middot; {cancelling.round} on{' '}
                {moment(cancelling.scheduledAt).format('MMM D, h:mm A')} moves to Cancelled. This can&apos;t be
                undone.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelling(null)} disabled={transition.isPending}>
              Keep session
            </Button>
            <Button variant="destructive" onClick={() => void confirmCancel()} disabled={transition.isPending}>
              {transition.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              Cancel session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SessionDetailDrawer
        session={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onStatusChanged={setSelected}
      />
    </Card>
  );
}

export default UpcomingSessions;
