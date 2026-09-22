'use client';

import { useState, type ReactNode } from 'react';
import moment from 'moment';
import {
  Building2,
  CalendarClock,
  CalendarDays,
  Code2,
  Flag,
  Layers,
  ListChecks,
  Video,
} from 'lucide-react';
import type { InterviewProcess, InterviewSession, SessionStatus } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { ProcessStatusBadge } from './process-status-badge';
import { SessionStatusBadge } from './session-status-badge';
import { SessionDetailDrawer } from './session-detail-drawer';

interface Props {
  process: InterviewProcess;
  className?: string;
}

function formatDate(value: string | null) {
  return value ? moment(value).format('MMM D, YYYY') : '—';
}

export function ProcessResume({ process, className }: Props) {
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const sessions = process.sessions ?? [];
  const latestFirst = [...sessions].sort(
    (a, b) => moment(b.scheduledAt).valueOf() - moment(a.scheduledAt).valueOf(),
  );
  const rounds = [...new Set([...latestFirst].reverse().map((session) => session.round))];

  const statusCounts = latestFirst.reduce<Partial<Record<SessionStatus, number>>>(
    (counts, session) => ({ ...counts, [session.status]: (counts[session.status] ?? 0) + 1 }),
    {},
  );
  const outcomes = Object.entries(statusCounts) as [SessionStatus, number][];

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] border border-border bg-background',
        className,
      )}
    >
      <header className="border-b border-border bg-muted/40 p-6 sm:p-8">
        <div className="space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[1.75rem] font-medium tracking-[-0.02em] text-foreground sm:text-[2rem]">
                {process.candidateName ?? 'Unknown candidate'}
              </h1>
              <ProcessStatusBadge status={process.status} />
            </div>
            <p className="mt-1 text-[15px] text-muted-foreground">{process.technology}</p>
          </div>
          {process.description ? (
            <p className="max-w-[52ch] text-[14px] leading-[1.65] text-muted-foreground">
              {process.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <MetaChip icon={Building2}>{process.clientName ?? 'Unknown client'}</MetaChip>
            {process.currentRound ? <MetaChip icon={Flag}>{process.currentRound}</MetaChip> : null}
            <MetaChip icon={CalendarDays}>Started {formatDate(process.startedAt)}</MetaChip>
            <MetaChip icon={ListChecks}>
              {process.sessionCount} {process.sessionCount === 1 ? 'session' : 'sessions'}
            </MetaChip>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="p-6 sm:p-8 lg:col-span-2">
          <section aria-labelledby="process-sessions">
            <SectionLabel id="process-sessions" icon={CalendarClock}>
              Sessions
            </SectionLabel>
            {latestFirst.length > 0 ? (
              <ol className="space-y-8 pl-2">
                {latestFirst.map((session) => (
                  <li key={session.id} className="relative pl-7">
                    <span
                      aria-hidden
                      className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedSession(session)}
                      className="-m-2 block w-[calc(100%+1rem)] rounded-lg p-2 text-left transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-[15px] font-medium text-foreground">{session.round}</h3>
                        <span className="w-fit font-mono text-[11px] text-muted-foreground">
                          {moment(session.scheduledAt).format('MMM D, YYYY · h:mm A')}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
                          {session.mode} &middot; {session.durationMinutes} min
                        </span>
                        <SessionStatusBadge status={session.status} />
                      </div>
                      {session.description ? (
                        <p className="mt-3 flex gap-2.5 text-[13.5px] leading-[1.6] text-muted-foreground">
                          <span
                            aria-hidden
                            className="mt-[8px] h-[3px] w-[3px] shrink-0 rounded-full bg-muted-foreground/50"
                          />
                          <span>{session.description}</span>
                        </p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                <CalendarClock className="h-5 w-5" />
                No sessions scheduled yet.
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-8 border-t border-border bg-muted/30 p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <section aria-labelledby="process-details">
            <SectionLabel id="process-details" icon={Building2}>
              Details
            </SectionLabel>
            <div className="space-y-4">
              <DetailEntry title={process.clientName ?? 'Unknown client'} caption="Client" />
              <DetailEntry title={process.technology} caption="Technology" />
              <DetailEntry title={process.currentRound ?? '—'} caption="Current round" />
            </div>
          </section>

          <section aria-labelledby="process-dates">
            <SectionLabel id="process-dates" icon={CalendarDays}>
              Dates
            </SectionLabel>
            <div className="space-y-4">
              <DetailEntry title="Started" caption={formatDate(process.startedAt)} mono />
              <DetailEntry title="Closed" caption={formatDate(process.closedAt)} mono />
              <DetailEntry title="Updated" caption={formatDate(process.updatedAt)} mono />
            </div>
          </section>

          {rounds.length > 0 ? (
            <section aria-labelledby="process-rounds">
              <SectionLabel id="process-rounds" icon={Layers}>
                Rounds
              </SectionLabel>
              <ul className="flex flex-wrap gap-1.5">
                {rounds.map((round) => (
                  <li
                    key={round}
                    className="rounded-[4px] border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                    {round}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>

        {outcomes.length > 0 ? (
          <div className="border-t border-border p-6 sm:p-8 lg:col-span-3">
            <section aria-labelledby="process-outcomes">
              <SectionLabel id="process-outcomes" icon={Code2}>
                Outcomes
              </SectionLabel>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {outcomes.map(([status, count]) => (
                  <li
                    key={status}
                    className="flex items-center justify-between rounded-[8px] border border-border p-3.5"
                  >
                    <SessionStatusBadge status={status} />
                    <span className="font-mono text-[15px] font-medium text-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      <SessionDetailDrawer
        session={selectedSession}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      />
    </div>
  );
}

interface SectionLabelProps {
  id: string;
  icon: typeof Building2;
  children: ReactNode;
}

function SectionLabel({ id, icon: Icon, children }: SectionLabelProps) {
  return (
    <h2
      id={id}
      className="mb-4 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.12em] text-muted-foreground uppercase"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      {children}
    </h2>
  );
}

interface MetaChipProps {
  icon: typeof Building2;
  children: ReactNode;
}

function MetaChip({ icon: Icon, children }: MetaChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  );
}

interface DetailEntryProps {
  title: string;
  caption: string;
  mono?: boolean;
}

function DetailEntry({ title, caption, mono }: DetailEntryProps) {
  return (
    <div className="border-l border-border pl-3">
      <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
      <p className={cn('mt-0.5 text-[13px] text-muted-foreground', mono && 'font-mono text-[11px]')}>
        {caption}
      </p>
    </div>
  );
}
