'use client';

import { useState } from 'react';
import { CalendarPlusIcon, FileSpreadsheetIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { InterviewProcess } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { ScheduleImportDrawer } from '@app/atro-ui/components/schedule-import-drawer';
import { NewProcessDrawer } from './new-process-drawer';
import { showProcessCreatedToast } from './process-created-toast';
import { ScheduleSessionDrawer } from './schedule-session-drawer';

type ActiveDrawer = 'process' | 'session' | 'import' | null;

interface Props {
  marketerId: string;
  name?: string | null;
}

export function MarketerHeader({ marketerId, name }: Props) {
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);
  const [sessionProcess, setSessionProcess] = useState<InterviewProcess | null>(null);

  const openDrawer = (drawer: ActiveDrawer) => setActiveDrawer(drawer);
  const drawerProps = (drawer: Exclude<ActiveDrawer, null>) => ({
    open: activeDrawer === drawer,
    onOpenChange: (open: boolean) => setActiveDrawer(open ? drawer : null),
  });

  const onProcessCreated = (process: InterviewProcess) =>
    showProcessCreatedToast(process, (created) => {
      setSessionProcess(created);
      openDrawer('session');
    });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketer dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back{name ? `, ${name}` : ''}. Here&apos;s what needs your attention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openDrawer('import')}>
            <FileSpreadsheetIcon />
            Import schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSessionProcess(null);
              openDrawer('session');
            }}
          >
            <CalendarPlusIcon />
            Schedule session
          </Button>
          <Button onClick={() => openDrawer('process')}>
            <PlusIcon />
            New process
          </Button>
        </div>
      </div>

      <NewProcessDrawer {...drawerProps('process')} marketerId={marketerId} onCreated={onProcessCreated} />
      <ScheduleSessionDrawer
        {...drawerProps('session')}
        initialProcess={sessionProcess}
        onScheduled={(session) =>
          toast.success(`${session.round} scheduled for ${session.candidateName ?? 'candidate'}`)
        }
      />
      <ScheduleImportDrawer {...drawerProps('import')} />
    </>
  );
}

export default MarketerHeader;
