'use client';

import Link from 'next/link';
import { CalendarPlusIcon, CircleCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { InterviewProcess } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';

interface Props {
  toastId: string | number;
  process: InterviewProcess;
  onAddSession: (process: InterviewProcess) => void;
}

export function ProcessCreatedToast({ toastId, process, onAddSession }: Props) {
  const dismiss = () => toast.dismiss(toastId);

  return (
    <div className="w-[356px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="flex items-start gap-3">
        <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Process created</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {process.candidateName ?? 'Unknown candidate'} &middot; {process.clientName ?? 'Unknown client'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{process.technology}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button asChild variant="ghost" size="sm" onClick={dismiss}>
          <Link href={`/marketer/processes/${process.id}`}>View process</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          OK
        </Button>
        <Button
          size="sm"
          onClick={() => {
            dismiss();
            onAddSession(process);
          }}
        >
          <CalendarPlusIcon />
          Add first session
        </Button>
      </div>
    </div>
  );
}

/** Shows the post-create toast; stays up longer than default since it carries actions. */
export function showProcessCreatedToast(
  process: InterviewProcess,
  onAddSession: (process: InterviewProcess) => void,
) {
  toast.custom(
    (id) => <ProcessCreatedToast toastId={id} process={process} onAddSession={onAddSession} />,
    { duration: 15000 },
  );
}

export default ProcessCreatedToast;
