'use client';

import Link from 'next/link';
import moment from 'moment';
import {
  CalendarIcon,
  ClockIcon,
  LaptopIcon,
  BriefcaseIcon,
  Building2Icon,
} from 'lucide-react';
import type { InterviewSession } from '@feature/base/server';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@app/atro-ui/components/ui/common/drawer';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { CopyButton } from '@app/atro-ui/components/ui/animate-ui/components/buttons/copy';
import { SessionStatusBadge } from './session-status-badge';
import { SessionFeedback } from './session-feedback';
import { SessionQuestionsDialog } from './session-questions-dialog';

function buildSessionSummary(session: InterviewSession) {
  return [
    'Live interview',
    '',
    `Candidate: ${session.candidateName ?? 'Unknown candidate'}`,
    `Client: ${session.clientName ?? 'Unknown client'}`,
    `Round: ${session.round}`,
    `Technology: ${session.technology ?? 'Unknown'}`,
    `Date: ${moment(session.scheduledAt).format('MMM D, YYYY · h:mm A')}`,
    `Duration: ${session.durationMinutes} min`,
    `Mode: ${session.mode}`,
    '',
    'Introduction about yourself, technical skills, work experience and current project',
  ].join('\n');
}

interface Props {
  session: InterviewSession | null;
  onOpenChange: (open: boolean) => void;
}

/** Props handed to a `renderSessionDrawer` override (e.g. the marketer drawer). */
export interface SessionDrawerRenderProps {
  session: InterviewSession | null;
  onOpenChange: (open: boolean) => void;
  /** Keeps the open drawer on the updated session after an edit. */
  onSessionChanged: (session: InterviewSession) => void;
}

// The question bank's `query` searchParam is a free-text search over topic
// + body (see apps/dashboard's /questions page) — encodeURIComponent keeps
// multi-word technologies ("Node JS") intact instead of breaking the URL.
function questionsHref(technology?: string | null) {
  if (!technology) return '/supporter/questions';
  return `/supporter/questions?query=${encodeURIComponent(technology)}`;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium">{value}</span>
    </div>
  );
}

export function SessionDetailDrawer({ session, onOpenChange }: Props) {
  return (
    <Drawer direction="right" open={!!session} onOpenChange={onOpenChange}>
      <DrawerContent>
        {session && (
          <>
            <DrawerHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DrawerTitle>{session.candidateName ?? 'Unknown candidate'}</DrawerTitle>
                  <DrawerDescription className="flex items-center gap-1.5">
                    <Link
                      href={`/supporter/processes/${session.processId}`}
                      className="underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {session.round}
                    </Link>
                    <span>&middot;</span>
                    <Link
                      href="/supporter/clients"
                      className="underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {session.clientName ?? 'Unknown client'}
                    </Link>
                  </DrawerDescription>
                </div>
                <SessionStatusBadge status={session.status} />
              </div>
            </DrawerHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 px-5 pb-5">
                <div className="flex flex-col gap-3 rounded-lg border border-border/50 p-4">
                  <DetailRow
                    icon={CalendarIcon}
                    label="Date"
                    value={moment(session.scheduledAt).format('MMM D, YYYY')}
                  />
                  <DetailRow
                    icon={ClockIcon}
                    label="Time"
                    value={`${moment(session.scheduledAt).format('h:mm A')} · ${session.durationMinutes} min`}
                  />
                  <DetailRow icon={LaptopIcon} label="Mode" value={session.mode} />
                </div>

                {session.technology && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Technology
                    </p>
                    <Link
                      href={questionsHref(session.technology)}
                      className="mt-1 inline-block text-sm text-primary underline-offset-2 hover:underline"
                    >
                      {session.technology}
                    </Link>
                  </div>
                )}

                {session.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">
                      {session.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 px-5 pb-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Copy details
                </span>
                <CopyButton
                  content={buildSessionSummary(session)}
                  variant="outline"
                  size="sm"
                  aria-label="Copy session details"
                />
              </div>

              <SessionFeedback session={session} />
            </div>

            <DrawerFooter className="flex-row gap-2 border-t border-border/50 pt-4">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/supporter/processes/${session.processId}`}>
                  <BriefcaseIcon />
                  Process
                </Link>
              </Button>
              <SessionQuestionsDialog session={session} />
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href="/supporter/clients">
                  <Building2Icon />
                  Client
                </Link>
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default SessionDetailDrawer;
