'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Skeleton } from '@feature/ui/components/ui/common/skeleton';
import { getSessionQuestions } from '@feature/backend/server';

interface Props {
  sessionId: string;
  className?: string;
}

/**
 * Fetches and displays the number of questions linked to a session.
 * Kept separate from ProcessSessionCard so the log can render many cards
 * without blocking on a per-session request.
 */
export function LinkedQuestionsBadge({ sessionId, className }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSessionQuestions(sessionId).then((response) => {
      if (cancelled) return;
      setCount(response.success ? response.data.length : 0);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (count === null) {
    return <Skeleton className={className ?? 'h-4 w-4'} />;
  }

  return (
    <Badge variant="outline" className={className ?? 'h-4 px-1 text-[10px] font-normal'}>
      {count}
    </Badge>
  );
}

export default LinkedQuestionsBadge;
