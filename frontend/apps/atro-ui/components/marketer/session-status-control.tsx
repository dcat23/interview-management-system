'use client';

import { useState } from 'react';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarClockIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { useTransitionSessionStatus } from '@feature/backend/hooks/session/use-transition-session-status';
import {
  MARKETER_RESCHEDULABLE_STATUSES,
  MARKETER_SESSION_TRANSITIONS,
  type InterviewSession,
  type SessionStatus,
} from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { SESSION_STATUS_CONFIG } from '@app/atro-ui/components/supporter/session-status-badge';
import { ScheduleSessionDrawer } from './schedule-session-drawer';

// Final statuses can't be reversed by anyone, so their confirmation says so.
const TERMINAL: SessionStatus[] = ['PASSED', 'REJECTED', 'CANCELLED'];

interface Props {
  session: InterviewSession;
  // Also called with the replacement session after a reschedule.
  onStatusChanged?: (session: InterviewSession) => void;
}

export function SessionStatusControl({ session, onStatusChanged }: Props) {
  const queryClient = useQueryClient();
  const transition = useTransitionSessionStatus();
  const [target, setTarget] = useState<SessionStatus | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const targets = MARKETER_SESSION_TRANSITIONS[session.status];
  const canReschedule = MARKETER_RESCHEDULABLE_STATUSES.includes(session.status);

  const apply = async () => {
    if (!target) return;
    try {
      const updated = await transition.mutateAsync({ sessionId: session.id, targetStatus: target });
      setTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onStatusChanged?.(updated);
    } catch {
      // The mutation hook already surfaces the error toast.
    }
  };

  return (
    <div className="flex flex-col gap-2 px-5 pb-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Set status</span>
        {session.statusChangedAt && (
          <span className="text-xs text-muted-foreground">Changed {moment(session.statusChangedAt).fromNow()}</span>
        )}
      </div>

      {targets.length === 0 && !canReschedule ? (
        <p className="text-sm text-muted-foreground">
          {SESSION_STATUS_CONFIG[session.status].label} is final — no further changes.
        </p>
      ) : target ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <p className="text-sm">
            Mark as <span className="font-medium">{SESSION_STATUS_CONFIG[target].label}</span>?
            {TERMINAL.includes(target) && (
              <span className="text-muted-foreground"> This can&apos;t be undone.</span>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setTarget(null)} disabled={transition.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={target === 'REJECTED' || target === 'CANCELLED' ? 'destructive' : 'default'}
              onClick={() => void apply()}
              disabled={transition.isPending}
            >
              {transition.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {targets.map((status) => (
            <Button key={status} variant="outline" size="sm" onClick={() => setTarget(status)}>
              {SESSION_STATUS_CONFIG[status].label}
            </Button>
          ))}
          {canReschedule && (
            <Button variant="outline" size="sm" onClick={() => setRescheduling(true)}>
              <CalendarClockIcon />
              Reschedule
            </Button>
          )}
        </div>
      )}

      {canReschedule && (
        <ScheduleSessionDrawer
          open={rescheduling}
          onOpenChange={setRescheduling}
          rescheduleFrom={session}
          onScheduled={(created) => {
            toast.success(`${created.round} rescheduled to ${moment(created.scheduledAt).format('MMM D, h:mm A')}`);
            onStatusChanged?.(created);
          }}
        />
      )}
    </div>
  );
}

export default SessionStatusControl;
