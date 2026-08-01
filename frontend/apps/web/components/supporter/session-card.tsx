import Link from 'next/link';
import { Card, CardContent } from '@feature/ui/components/ui/common/card';
import { Briefcase, Calendar, ChevronRight, Clock } from 'lucide-react';
import { ModeBadge, StatusBadge } from './session-badges';
import type { InterviewSession } from '@feature/base/server';

export type SessionCardData = InterviewSession;

function formatDate(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString('en-US', timeFormat)} - ${end.toLocaleTimeString('en-US', timeFormat)}`;
}

export function SessionCard({ session }: { session: SessionCardData }) {
  return (
    <Link href={`/supporter/sessions/${session.id}`} className="block group">
      <Card className="bg-card hover:border-primary/30 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{session.candidateName}</h3>
                <ModeBadge mode={session.mode} />
                <StatusBadge status={session.status} />
              </div>

              <p className="text-sm text-muted-foreground">{session.clientName}</p>

              <div className="space-y-2 text-sm text-muted-foreground">
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
                  <span>{session.technology} — Round {session.round}</span>
                </div>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
