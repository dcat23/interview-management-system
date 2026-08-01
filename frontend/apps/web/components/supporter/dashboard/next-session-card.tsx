import { Suspense } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Briefcase, Calendar, Clock, ArrowRight, CalendarClock } from 'lucide-react';
import { getInterviewSessions } from '@feature/backend/server';
import { ModeBadge } from '../session-badges';
import { NextSessionCardSkeleton } from './next-session-card-skeleton';

function formatDate(dateString: string) {
  return moment(dateString).format('dddd, MMMM D, YYYY');
}

function formatTime(scheduledAt: string, durationMinutes: number) {
  const start = moment(scheduledAt);
  const end = moment(scheduledAt).add(durationMinutes, 'minutes');
  return `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
}

export function NextSessionCard() {
  return (
    <Suspense fallback={<NextSessionCardSkeleton />}>
      <NextSessionCardData />
    </Suspense>
  );
}

async function NextSessionCardData() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: sessionPage } = await getInterviewSessions({
    scheduledFrom: today,
    sort: 'scheduledAt,asc',
    limit: 1,
  });
  const session = sessionPage.data[0] ?? null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-medium">Next Session</CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-wide">
            Your soonest upcoming interview
          </CardDescription>
        </div>
        <Link
          href="/supporter/sessions"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group"
        >
          <span className="font-mono text-xs uppercase tracking-wide">View all</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent>
        {session ? (
          <Link
            href={`/supporter/sessions/${session.id}`}
            className="group block rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                    {session.candidateName}
                  </h3>
                  <ModeBadge mode={session.mode} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{session.clientName}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
            </div>

            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(session.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(session.scheduledAt, session.durationMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>
                  {session.technology} — {session.round}
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-secondary/20 py-12 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No upcoming sessions</h3>
            <p className="mt-1 text-sm text-muted-foreground">New interview sessions will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}