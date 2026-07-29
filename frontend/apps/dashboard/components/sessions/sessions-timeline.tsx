'use client';

import { ReactNode } from 'react';

interface Props {
  data?: unknown;
  children?: ReactNode;
}

export function SessionsTimeline(props: Props) {
  return (
    <TimelineProvider
      config={{ startHour: 8, endHour: 18, snapIntervalMinutes: 15 }}
      onSlotClick={(slotId) => {
        setSelectedSlot(slots.find((slot) => slot.id === slotId) ?? null);
      }}
      onSlotPositionChange={moveSlot}
      onSlotResize={resizeSlot}
    >
      <Timeline slots={slots} rows={rows}>
        <TimelineGrid>
          <TimelineHeader columnLabel="Room" />
          {rows.map((row) => (
            <TimelineRow key={row.id} row={row} slots={slots}>
              {(slot) => (
                <TimelineSlot slot={slot}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex h-full flex-col justify-center px-3">
                        <TimelineSlotLabel>
                          {String(slot.title)}
                        </TimelineSlotLabel>
                        <TimelineSlotContent>
                          {slot.startTime}
                        </TimelineSlotContent>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => setSelectedSlot(slot)}>
                        Open details
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => duplicateSlot(slot)}>
                        Duplicate slot
                      </ContextMenuItem>
                      <ContextMenuItem
                        variant="destructive"
                        className="bg-destructive/10 text-destructive"
                        onSelect={() => deleteSlot(slot)}
                      >
                        Delete slot
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </TimelineSlot>
              )}
            </TimelineRow>
          ))}
        </TimelineGrid>
      </Timeline>
    </TimelineProvider>
  );
}

export default SessionsTimeline;
