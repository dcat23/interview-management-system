import Link from 'next/link';
import moment from 'moment';
import { ExternalLinkIcon, ListChecksIcon, MessageSquareIcon, MessageSquarePlusIcon } from 'lucide-react';

import { AnimatedCopyButton } from '@app/dashboard/components/ui/animated-copy-button';
import { LinkedQuestionsBadge } from '@app/dashboard/components/session/linked-questions-badge';
import { SessionStateToggleCard } from '@app/dashboard/components/session/session-state-toggle-card';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Button } from '@feature/ui/components/ui/common/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@feature/ui/components/ui/common/card';
import { Separator } from '@feature/ui/components/ui/common/separator';
import { cn } from '@feature/ui/lib/ui/utils';
import type { InterviewSession } from '@feature/base/server';

interface Props {
  session: InterviewSession;
  className?: string;
}

function buildSessionSummary(session: InterviewSession) {
  return [
    'Live interview',
    `Candidate: ${session.candidateName ?? 'Unknown candidate'}`,
    `Client: ${session.clientName ?? 'Unknown client'}`,
    `Technology: ${session.technology ?? 'Unknown tech'}`,
    `Round: ${session.round}`,
    'Introduction about yourself, technical skills, work experience and current project',
  ].join('\n');
}

export function ProcessSessionCard({ session, className }: Props) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{session.round}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {session.mode} &middot; {session.durationMinutes} min
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {moment(session.scheduledAt).format('MMM D, YYYY · h:mm A')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TODO: wire to real supporter feedback once the dashboard feedback API exists */}
        <div className="min-w-0 rounded-md border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <MessageSquareIcon className="size-3.5" />
            Supporter feedback
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Not provided yet</span>
            <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
              Generate feedback
            </Button>
          </div>
        </div>

        <SessionStateToggleCard session={session} />
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ListChecksIcon className="size-3.5" />
          <span>Linked questions</span>
          <LinkedQuestionsBadge sessionId={session.id} />
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: open a feedback modal/popover */}
          <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
            <MessageSquarePlusIcon />
            Feedback
          </Button>
          <AnimatedCopyButton
            value={buildSessionSummary(session)}
            label="Copy"
            copiedLabel="Copied"
            size="sm"
            variant="default"
          />
          <Button type="button" variant="ghost" size="icon-sm" asChild>
            <Link href={`/sessions/${session.id}`}>
              <ExternalLinkIcon />
              <span className="sr-only">Open session</span>
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ProcessSessionCard;
