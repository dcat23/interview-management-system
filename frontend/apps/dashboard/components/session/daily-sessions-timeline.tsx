'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';

import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@feature/ui/components/ui/common/card';
import { Skeleton } from '@feature/ui/components/ui/common/skeleton';
import type { InterviewSession } from '@feature/base/server';
import { DatePickerField } from '../ui/date-picker-field';
import { Timeline, TimelineProvider, TimelineRowData, TimelineSlotData } from '../ui/timeline';

const UNKNOWN_CLIENT = 'Unknown client';

function toDateParam(date: Date) {
  return moment(date).format('YYYY-MM-DD');
}

// The day's sessions render as a vertical agenda (ui/timeline's built-in
// `mobileMode="agenda"` list), grouped by client rather than status.
function buildRows(sessions: InterviewSession[]): TimelineRowData[] {
  const clients = Array.from(
    new Set(sessions.map((session) => session.clientName ?? UNKNOWN_CLIENT)),
  );

  return clients.map((client) => ({ id: client, label: client }));
}

function buildSlots(sessions: InterviewSession[]): TimelineSlotData[] {
  return sessions.map((session) => ({
    id: session.id,
    rowId: session.clientName ?? UNKNOWN_CLIENT,
    startTime: moment(session.scheduledAt).format('HH:mm'),
    duration: session.durationMinutes,
    title: session.candidateName ?? 'Unknown candidate',
    owner: session.round,
  }));
}

export function DailySessionsTimeline() {
  const [date, setDate] = useState<Date>(new Date());
  const router = useRouter();
  const dateParam = toDateParam(date);

  const { data: pageResponse, isLoading } = useSessions({
    page: 0,
    limit: 100,
    scheduledFrom: dateParam,
    scheduledTo: dateParam,
    sort: 'scheduledAt,asc',
  });

  const sessions = pageResponse?.data ?? [];
  const rows = useMemo(() => buildRows(sessions), [sessions]);
  const slots = useMemo(() => buildSlots(sessions), [sessions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sessions</CardTitle>
        <CardDescription>
          {moment(date).format('dddd, MMMM D, YYYY')}
        </CardDescription>
        <CardAction>
          <DatePickerField
            date={date}
            onSelect={(selected) => selected && setDate(selected)}
            closeOnSelect
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            No sessions scheduled for this day.
          </div>
        ) : (
          <TimelineProvider
            config={{ startHour: 0, endHour: 24 }}
            onSlotClick={(slotId) => router.push(`/sessions/${slotId}`)}
          >
            <Timeline slots={slots} rows={rows} mobileMode="agenda">
              <></>
            </Timeline>
          </TimelineProvider>
        )}
      </CardContent>
    </Card>
  );
}

export default DailySessionsTimeline;
