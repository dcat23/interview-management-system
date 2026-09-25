'use client';

import Link from 'next/link';
import moment from 'moment';
import { Activity, ArrowUpRight, Circle } from 'lucide-react';

import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import type { InterviewProcess } from '@feature/base/server';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import { cn } from '@app/atro-ui/lib/ui/utils';

const PROCESS_LIMIT = 50;
const MAX_ROUND_SEGMENTS = 6;

interface RoundSegmentsProps {
  sessionCount: number;
}

// Sessions held so far, one segment each — a process has no fixed number of
// rounds, so this stands in for the live board's progress bar.
function RoundSegments({ sessionCount }: RoundSegmentsProps) {
  const filled = Math.min(sessionCount, MAX_ROUND_SEGMENTS);
  return (
    <div className="mt-1.5 flex gap-1" aria-hidden>
      {Array.from({ length: MAX_ROUND_SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={cn('h-1 flex-1 rounded-full', i < filled ? 'bg-primary' : 'bg-muted')}
        />
      ))}
    </div>
  );
}

interface ProcessRowProps {
  process: InterviewProcess;
  index: number;
  basePath: string;
}

function ProcessRow({ process, index, basePath }: ProcessRowProps) {
  return (
    <li
      className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link
        href={`${basePath}/processes/${process.id}`}
        className="group grid grid-cols-1 items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/50 md:grid-cols-12 md:gap-4 md:px-6"
      >
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground md:col-span-1">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 md:col-span-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">
              {process.candidateName ?? 'Unknown candidate'}
            </h3>
            <span className="shrink-0 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{process.technology}</p>
        </div>
        <div className="md:col-span-5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{process.currentRound ?? 'No rounds yet'}</span>
            <span className="tabular-nums">
              {process.sessionCount} session{process.sessionCount === 1 ? '' : 's'}
            </span>
          </div>
          <RoundSegments sessionCount={process.sessionCount} />
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <Circle className="mr-1 inline size-2 fill-emerald-500 text-emerald-500" />
            Updated {moment(process.updatedAt).fromNow()}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground md:col-span-2 md:justify-end">
          Started {moment(process.startedAt).format('MMM D')}
          <ArrowUpRight className="size-3" />
        </span>
      </Link>
    </li>
  );
}

interface Props {
  clientId: string;
  /** Role route prefix for row links, e.g. "/marketer". */
  basePath?: string;
}

export function ClientActiveProcesses({ clientId, basePath = '/supporter' }: Props) {
  const { data: pageResponse, isLoading, dataUpdatedAt } = useProcesses({
    page: 0,
    limit: PROCESS_LIMIT,
    status: 'ACTIVE',
    clientId,
    sort: 'updatedAt,desc',
  });

  const processes = pageResponse?.data ?? [];
  const total = pageResponse?.total ?? 0;

  return (
    <section className="overflow-hidden rounded-xl border border-border/50">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Live · {total} active process{total === 1 ? '' : 'es'}
          </span>
        </div>
        {dataUpdatedAt ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Activity className="size-3" />
            Updated {moment(dataUpdatedAt).format('h:mm A')}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4 md:p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : processes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground md:px-6">
          No active processes with this client right now.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {processes.map((process, i) => (
            <ProcessRow key={process.id} process={process} index={i} basePath={basePath} />
          ))}
        </ul>
      )}

      {total > processes.length ? (
        <p className="border-t border-border/50 px-4 py-3 text-[11px] text-muted-foreground md:px-6">
          Showing the {processes.length} most recently updated of {total} active processes.
        </p>
      ) : null}
    </section>
  );
}

export default ClientActiveProcesses;
