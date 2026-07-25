import { Card, CardContent } from '@feature/ui/components/card';
import { Badge } from '@feature/ui/components/badge';
import { Briefcase, Building2, Layers, User } from 'lucide-react';
import type { Process, ProcessStatus } from '@app/web/lib/data/processes';

function statusVariant(status: ProcessStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'Offer Extended') return 'default';
  if (status === 'On Hold') return 'outline';
  return 'secondary';
}

interface Props {
  process: Process;
}

export function ProcessCard(props: Props) {
  const { process } = props;

  return (
    <Card className="bg-card hover:border-primary/30 transition-colors">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <User className="h-6 w-6 text-primary" />
          </div>
          <Badge
            variant={statusVariant(process.status)}
            className={
              process.status === 'Offer Extended'
                ? 'bg-primary/15 text-primary border border-primary/20 hover:bg-primary/15'
                : process.status === 'On Hold'
                  ? 'text-muted-foreground'
                  : ''
            }
          >
            {process.status}
          </Badge>
        </div>

        <div className="mt-4 flex-1">
          <h3 className="font-medium leading-tight text-pretty">{process.candidateName}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{process.technology}</p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {process.clientName}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wide">{process.currentRound}</span>
          <span className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            {process.sessionCount} {process.sessionCount === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
