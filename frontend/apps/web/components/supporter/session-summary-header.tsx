import { Card, CardContent } from '@feature/ui/components/card';
import { Calendar, Clock, User } from 'lucide-react';
import { ModeBadge, StatusBadge } from './session-badges';
import { sessionTitle, type Session } from '@app/web/lib/data/sessions';

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionSummaryHeader({ session, condensed = false }: { session: Session; condensed?: boolean }) {
  return (
    <Card className="bg-card">
      <CardContent className={condensed ? 'p-4 sm:p-5' : 'p-5 sm:p-6'}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ModeBadge mode={session.mode} />
            <StatusBadge status={session.status} />
          </div>

          <h1 className={condensed ? 'text-xl font-semibold tracking-tight' : 'text-2xl font-semibold tracking-tight md:text-3xl'}>
            {sessionTitle(session)}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span>{session.candidateName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{session.time}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
