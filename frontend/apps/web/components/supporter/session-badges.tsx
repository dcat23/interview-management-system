import { Badge } from '@feature/ui/components/badge';
import { cn } from '@feature/ui/lib/utils';
import type { SessionMode, SessionStatus } from '@app/web/lib/data/sessions';

const statusStyles: Record<SessionStatus, string> = {
  Scheduled: 'border-primary/30 bg-primary/10 text-primary',
  'In Review': 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Passed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  'No Show': 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-xs uppercase tracking-wide', statusStyles[status], className)}>
      {status}
    </Badge>
  );
}

export function ModeBadge({ mode, className }: { mode: SessionMode; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('font-mono text-xs uppercase tracking-wide', className)}>
      {mode}
    </Badge>
  );
}