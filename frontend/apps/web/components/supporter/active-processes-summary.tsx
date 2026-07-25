import Link from 'next/link';
import { Card, CardContent } from '@feature/ui/components/card';
import { Briefcase, ArrowRight } from 'lucide-react';
import type { Process } from '@app/web/lib/data/processes';

interface Props {
  processes: Process[];
}

export function ActiveProcessesSummary(props: Props) {
  const { processes } = props;
  const preview = processes.slice(0, 4);

  return (
    <Link href="/supporter/processes" className="block">
      <Card className="group bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 hover:border-primary/30">
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5 sm:w-64 sm:shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 transition-colors group-hover:border-primary/40">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-light">{processes.length}</p>
              <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Active Processes</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2">
              {preview.map((process) => (
                <span
                  key={process.id}
                  className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <span className="text-foreground">{process.candidateName}</span>
                  <span className="mx-1.5 text-border">|</span>
                  {process.clientName}
                </span>
              ))}
              {processes.length > preview.length ? (
                <span className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground">
                  +{processes.length - preview.length} more
                </span>
              ) : null}
            </div>
          </div>

          <span className="flex shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wide text-primary">
            View all
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
