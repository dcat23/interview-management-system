'use client';

import moment from 'moment';

import {
  TimelineSlot,
  TimelineSlotContent,
  TimelineSlotData,
  TimelineSlotLabel,
} from '../ui/timeline';
import { SESSION_STATUS_CONFIG } from './session-badges';
import { cn } from '@feature/ui/lib/ui/utils';
import type { InterviewSession } from '@feature/base/server';

interface Props {
  slot: TimelineSlotData;
  activeSlotId?: string | null;
  getSnappedDelta?: (deltaX: number) => number;
}

export function SessionTimelineSlot({ slot, ...injected }: Props) {
  const session = slot.session as InterviewSession;
  const config = SESSION_STATUS_CONFIG[session.status];
  const endTime = moment(session.scheduledAt)
    .add(session.durationMinutes, 'minutes')
    .format('h:mm A');

  return (
    <TimelineSlot
      slot={slot}
      {...injected}
      className={cn('border bg-card', config.className)}
    >
      <div className="flex h-full flex-col justify-center gap-0.5 px-2">
        <TimelineSlotLabel className="text-foreground">
          {session.candidateName ?? 'Unknown candidate'}
        </TimelineSlotLabel>
        <TimelineSlotContent className="truncate text-muted-foreground">
          {session.round} &middot; {moment(session.scheduledAt).format('h:mm A')}
          {'–'}
          {endTime}
        </TimelineSlotContent>
      </div>
    </TimelineSlot>
  );
}

export default SessionTimelineSlot;
