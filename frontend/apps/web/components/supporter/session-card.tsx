import Link from 'next/link';
import { Card, CardContent } from '@feature/ui/components/card';
import { Briefcase, Calendar, ChevronRight, Clock } from 'lucide-react';
import { ModeBadge, StatusBadge } from './session-badges';
import { sessionTitle, type Session } from '@app/web/lib/data/sessions';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionCard({ session }: { session: Session }) {
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
                  <span>{formatDate(session.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{session.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>{sessionTitle(session)}</span>
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
