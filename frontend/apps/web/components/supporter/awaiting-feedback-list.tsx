import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@feature/ui/components/ui/common/card';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { CheckCircle2, ChevronRight, PenLine } from 'lucide-react';
import type { SessionCardData } from '@app/web/components/supporter/session-card';

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

interface Props {
  sessions: SessionCardData[];
}

export function AwaitingFeedbackList(props: Props) {
  const { sessions } = props;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Awaiting Feedback</CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wide">
          Past sessions still needing your write-up
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/supporter/sessions/${session.id}/feedback`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-secondary/20 p-4 transition-all hover:border-primary/30 hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5">
                    <PenLine className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium group-hover:text-primary transition-colors">
                      {session.candidateName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.technology} — Round {session.round} | {formatShortDate(session.scheduledAt)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">Needs feedback</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-secondary/20 py-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-medium">You&rsquo;re all caught up</h3>
            <p className="mt-1 text-sm text-muted-foreground">Feedback has been submitted for every past session</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
