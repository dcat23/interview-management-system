import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Activity, ArrowRight } from 'lucide-react';
import type { ActivityItem } from '@app/web/lib/supporter/activity-feed';

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface Props {
  updates: ActivityItem[];
}

export function ProcessUpdatesFeed(props: Props) {
  const { updates } = props;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-medium">Interview Process Updates</CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-wide">
            Recent activity across all processes
          </CardDescription>
        </div>
        <Link
          href="/supporter/processes"
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group"
        >
          <span className="font-mono text-xs uppercase tracking-wide">View all</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l border-border/60 pl-6">
          {updates.map((update) => (
            <li key={update.id} className="relative">
              <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center">
                <span className="h-2 w-2 rounded-full bg-primary" />
              </span>
              <Link
                href={`/supporter/processes?highlight=${update.processId}`}
                className="group block rounded-lg p-2 -m-2 transition-colors hover:bg-secondary/40"
              >
                <p className="text-sm leading-relaxed group-hover:text-primary transition-colors text-pretty">
                  {update.message}
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  {formatTimestamp(update.timestamp)}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
