import type { ReactNode } from 'react';
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export interface StatTileDelta {
  /** Signed change vs the named period. */
  value: number;
  /** Named comparison period, e.g. "last week". */
  period: string;
  /** Unit appended to the number, e.g. " pts". */
  unit?: string;
  /** Whether an increase is good — sets the color; the arrow always shows direction. */
  upIsGood?: boolean;
}

interface Props {
  label: string;
  value: number | string | null | undefined;
  /** Shown instead of the delta line — secondary context in muted ink. */
  hint?: ReactNode;
  delta?: StatTileDelta;
  isLoading?: boolean;
  className?: string;
}

/**
 * Stat tile: sentence-case label, auto-compacted semibold value, and an
 * optional signed delta vs a named period. Delta color = direction × whether
 * up is good, always paired with an arrow so it never relies on color alone.
 */
export function StatTile({ label, value, hint, delta, isLoading = false, className }: Props) {
  const display = typeof value === 'number' ? compact.format(value) : (value ?? '—');

  return (
    <div className={cn('flex flex-col gap-1 rounded-lg border bg-card p-4', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-28" />
        </>
      ) : (
        <>
          <span className="text-3xl font-semibold tracking-tight text-foreground">{display}</span>
          {delta ? <DeltaLine delta={delta} /> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </>
      )}
    </div>
  );
}

interface DeltaLineProps {
  delta: StatTileDelta;
}

function DeltaLine({ delta }: DeltaLineProps) {
  const { value, period, unit = '', upIsGood = true } = delta;
  const flat = value === 0;
  const good = flat ? null : (value > 0) === upIsGood;
  const Icon = flat ? ArrowRightIcon : value > 0 ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium',
          good === true && 'text-emerald-700 dark:text-emerald-400',
          good === false && 'text-rose-700 dark:text-rose-400',
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {value > 0 ? '+' : ''}
        {compact.format(value)}
        {unit}
      </span>
      vs {period}
    </span>
  );
}

export default StatTile;
