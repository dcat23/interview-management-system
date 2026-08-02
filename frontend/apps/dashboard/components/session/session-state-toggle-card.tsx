'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type { InterviewSession, SessionStatus } from '@feature/base/server';
import { SESSION_STATUS_TRANSITIONS } from '@feature/base/server';
import {
  AnimatedToggleCard,
  type AnimatedToggleCardItem,
} from '@feature/ui/components/ui/animated-toggle-card';
import { useTransitionSessionStatus } from '@app/dashboard/hooks/session/use-transition-session-status';

interface Props {
  session: InterviewSession;
  className?: string;
}

const statusConfig: Record<
  SessionStatus,
  { label: string; tone: AnimatedToggleCardItem['tone'] }
> = {
  SCHEDULED: { label: 'Scheduled', tone: 'default' },
  IN_REVIEW: { label: 'In review', tone: 'warning' },
  PASSED: { label: 'Passed', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'destructive' },
  NO_SHOW: { label: 'No show', tone: 'destructive' },
  CANCELLED: { label: 'Cancelled', tone: 'destructive' },
};

export function SessionStateToggleCard({ session, className }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    session.status,
  );
  const transitionMutation = useTransitionSessionStatus();

  const items: AnimatedToggleCardItem[] = SESSION_STATUS_TRANSITIONS[
    session.status
  ].map((targetStatus) => ({
    value: targetStatus,
    title: statusConfig[targetStatus].label,
    tone: statusConfig[targetStatus].tone,
  }));

  const handleValueChange = (value: string) => {
    const targetStatus = value as SessionStatus;
    if (targetStatus === session.status) {
      return;
    }

    startTransition(async () => {
      setOptimisticStatus(targetStatus);
      try {
        await transitionMutation.mutateAsync({
          sessionId: session.id,
          targetStatus,
        });
        router.refresh();
      } catch {
        // toast already surfaced by useTransitionSessionStatus; leaving the
        // RSC-fetched session untouched lets the optimistic value revert
        // itself once this transition settles.
      }
    });
  };

  return (
    <AnimatedToggleCard
      className={className}
      items={items}
      value={optimisticStatus}
      onValueChange={handleValueChange}
    />
  );
}

export default SessionStateToggleCard;
