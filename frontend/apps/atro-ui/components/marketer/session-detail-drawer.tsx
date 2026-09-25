'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { BriefcaseIcon, Building2Icon, CalendarIcon, ClockIcon, LaptopIcon, UserIcon } from 'lucide-react';
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
import { SessionStatusBadge } from '@app/atro-ui/components/supporter/session-status-badge';
import { SessionFeedbackView } from './session-feedback-view';
import { SessionQuestionsDialog } from './session-questions-dialog';
import { SessionStatusControl } from './session-status-control';

interface DetailRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-right text-sm font-medium">{value}</span>
    </div>
  );
}

interface Props {
  session: InterviewSession | null;
  onOpenChange: (open: boolean) => void;
  onStatusChanged?: (session: InterviewSession) => void;
}

/**
 * Marketer's counterpart of the supporter SessionDetailDrawer, same layout.
 * Where the supporter drawer has "Copy details" this offers the status
 * transitions a marketer may apply; feedback and questions are read-only.
 */
export function SessionDetailDrawer({ session, onOpenChange, onStatusChanged }: Props) {
  return (
    <Drawer direction="right" open={!!session} onOpenChange={onOpenChange}>
      <DrawerContent>
        {session && (
          <>
            <DrawerHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DrawerTitle className="truncate">{session.candidateName ?? 'Unknown candidate'}</DrawerTitle>
                  <DrawerDescription className="truncate">
                    {session.round} &middot; {session.clientName ?? 'Unknown client'}
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
                  <DetailRow icon={UserIcon} label="Supporter" value={session.supporterName ?? '—'} />
                </div>

                {session.technology && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Technology</p>
                    <p className="mt-1 text-sm text-foreground">{session.technology}</p>
                  </div>
                )}

                {session.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{session.description}</p>
                  </div>
                )}
              </div>

              {/* Keyed so a pending confirmation doesn't carry over to another session. */}
              <SessionStatusControl key={session.id} session={session} onStatusChanged={onStatusChanged} />

              <SessionFeedbackView session={session} />
            </div>

            <DrawerFooter className="flex-row gap-2 border-t border-border/50 pt-4">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/marketer/processes/${session.processId}`}>
                  <BriefcaseIcon />
                  Process
                </Link>
              </Button>
              <SessionQuestionsDialog session={session} />
              <Button asChild variant="outline" size="sm" className="flex-1">
                {/* clientId can be null briefly for sessions cached before it was added; fall back to the list. */}
                <Link href={session.clientId ? `/marketer/clients/${session.clientId}` : '/marketer/clients'}>
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
