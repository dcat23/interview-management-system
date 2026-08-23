import { Badge } from '@feature/ui/components/ui/common/badge';
import { cn } from '@feature/ui/lib/ui/utils';
import type { SessionStatus } from '@feature/base/server';

export const SESSION_STATUS_CONFIG: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  IN_REVIEW: {
    label: 'In review',
    className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  PASSED: {
    label: 'Passed',
    className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  },
  NO_SHOW: {
    label: 'No show',
    className: 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    className: 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  },
};

interface StatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = SESSION_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className, className)}>
      {config.label}
    </Badge>
  );
}

interface ModeBadgeProps {
  mode: string;
  className?: string;
}

export function ModeBadge({ mode, className }: ModeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('font-mono text-xs uppercase tracking-wide', className)}>
      {mode}
    </Badge>
  );
}
