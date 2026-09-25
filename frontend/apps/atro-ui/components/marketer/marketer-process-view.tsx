'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarPlusIcon } from 'lucide-react';
import type { InterviewProcess } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { ProcessResume } from '@app/atro-ui/components/supporter/process-resume';
import { ScheduleSessionDrawer } from './schedule-session-drawer';
import { SessionDetailDrawer } from './session-detail-drawer';

interface Props {
  process: InterviewProcess;
}

/**
 * Marketer's process page: the shared ProcessResume layout with a
 * "Schedule session" action and the marketer session drawer. The process is
 * server-fetched, so edits refresh the route to re-render the timeline.
 */
export function MarketerProcessView({ process }: Props) {
  const router = useRouter();
  const [scheduling, setScheduling] = useState(false);

  return (
    <>
      <ProcessResume
        process={process}
        actions={
          <Button size="sm" onClick={() => setScheduling(true)}>
            <CalendarPlusIcon />
            Schedule session
          </Button>
        }
        renderSessionDrawer={({ session, onOpenChange, onSessionChanged }) => (
          <SessionDetailDrawer
            session={session}
            onOpenChange={onOpenChange}
            onSessionChanged={(updated) => {
              onSessionChanged(updated);
              router.refresh();
            }}
          />
        )}
      />

      <ScheduleSessionDrawer
        open={scheduling}
        onOpenChange={setScheduling}
        initialProcess={process}
        onScheduled={(session) => {
          toast.success(`${session.round} scheduled for ${session.candidateName ?? 'candidate'}`);
          router.refresh();
        }}
      />
    </>
  );
}

export default MarketerProcessView;
