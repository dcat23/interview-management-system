'use client';

import { ReactNode } from 'react';
import {
  Timeline,
  TimelineCurrentTime,
  TimelineGrid,
  TimelineHeader,
  TimelineProvider,
  TimelineRow,
  TimelineRowData,
  TimelineSlotData,
} from '../ui/timeline';
import SessionTimelineSlot from './session-timeline-slot';

interface Props {
  data?: unknown;
  children?: ReactNode;
}

export function SessionsTimeline(props: Props) {
  const rows: TimelineRowData[] = [];
  const slots: TimelineSlotData[] = [];

  function moveSlot(
    slotId: string,
    newTime: string,
    newRowId: string,
  ): boolean | Promise<boolean> {
    throw new Error('Function not implemented.');
  }

  return (
    <TimelineProvider
      config={{ startHour: 8, endHour: 18, snapIntervalMinutes: 30 }}
      percentageInView={72}
      onValidateDrop={(_slotId, newTime, newRowId) =>
        !(newRowId === 'studio-c' && newTime < '12:00')
      }
      onSlotPositionChange={moveSlot}
    >
      <Timeline slots={slots} rows={rows}>
        <TimelineGrid>
          <TimelineHeader columnLabel="Team" />
          <TimelineCurrentTime />
          {rows.map((row) => (
            <TimelineRow
              key={row.id}
              row={row}
              slots={slots}
              renderRowExtras={(item) =>
                item.id === 'studio-c' ? (
                  <div className="absolute top-0 bottom-0 left-0 w-[240px] bg-muted/40" />
                ) : null
              }
            >
              {(slot) => <SessionTimelineSlot slot={slot} />}
            </TimelineRow>
          ))}
        </TimelineGrid>
      </Timeline>
    </TimelineProvider>
  );
}

export default SessionsTimeline;
