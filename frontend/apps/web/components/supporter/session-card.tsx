import Link from 'next/link';
import { Card, CardContent } from '@feature/ui/components/card';
import { Calendar, ChevronRight } from 'lucide-react';
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
      <Card className="bg-card transition-colors group-hover:border-primary/30">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <ModeBadge mode={session.mode} />
                <StatusBadge status={session.status} />
              </div>

              <h3 className="text-lg font-semibold leading-tight text-balance group-hover:text-primary transition-colors">
                {sessionTitle(session)}
              </h3>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  {formatDate(session.date)} &middot; {session.time}
                </span>
              </div>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}