import { Badge } from '@feature/ui/components/ui/common/badge';
import { cn } from '@feature/ui/lib/ui/utils';
import type { FeedbackState } from '@app/web/lib/data/sessions';
import type { SessionStatus } from '@feature/base/server';

const statusStyles: Record<SessionStatus, string> = {
  SCHEDULED: 'border-primary/30 bg-primary/10 text-primary',
  IN_REVIEW: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  PASSED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  REJECTED: 'border-destructive/30 bg-destructive/10 text-destructive',
  NO_SHOW: 'border-border bg-muted text-muted-foreground',
  CANCELLED: 'border-border bg-muted text-muted-foreground',
};

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-xs uppercase tracking-wide', statusStyles[status], className)}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export function ModeBadge({ mode, className }: { mode: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn('font-mono text-xs uppercase tracking-wide', className)}>
      {mode}
    </Badge>
  );
}

export function FeedbackStatusBadge({ status }: { status: FeedbackState }) {

  if (status.submitted) {
    return (
      <Badge variant="default" className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/15">
        Feedback submitted
      </Badge>
    )
  }

  if (status.content) {
    return <Badge variant="secondary">Draft saved</Badge>
  }

  return <Badge variant="outline">No feedback yet</Badge>
}
