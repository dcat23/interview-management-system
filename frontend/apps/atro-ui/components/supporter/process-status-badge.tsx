import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { cn } from '@app/atro-ui/lib/ui/utils';
import type { ProcessStatus } from '@feature/base/server';

export const PROCESS_STATUS_CONFIG: Record<ProcessStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-500/15 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
  },
};

interface Props {
  status: ProcessStatus;
  className?: string;
}

export function ProcessStatusBadge({ status, className }: Props) {
  const config = PROCESS_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className, className)}>
      {config.label}
    </Badge>
  );
}
