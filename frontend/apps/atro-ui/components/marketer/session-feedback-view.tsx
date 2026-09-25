'use client';

import moment from 'moment';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, LockIcon } from 'lucide-react';
import { getFeedback } from '@feature/backend/server';
import type { InterviewSession } from '@feature/base/server';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@app/atro-ui/components/ui/common/card';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';

interface Props {
  session: InterviewSession;
}

/**
 * Read-only counterpart of the supporter's SessionFeedback card — marketers
 * can read feedback (drafts included) but only the assigned supporter writes it.
 */
export function SessionFeedbackView({ session }: Props) {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ['feedback', session.id],
    queryFn: async () => {
      const response = await getFeedback(session.id);
      // No feedback record yet comes back as an unsuccessful response.
      return response.success ? (response.data ?? null) : null;
    },
  });

  return (
    <div className="px-5 pb-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LockIcon className="h-4 w-4 text-primary" />
            Feedback
            {feedback && (
              <Badge variant={feedback.isSubmitted ? 'soft' : 'outline'} className="ml-auto">
                {feedback.isSubmitted && <CheckIcon className="h-3 w-3" />}
                {feedback.isSubmitted ? 'Submitted' : 'Draft'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : feedback?.body ? (
            <p className="rounded-lg border border-border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback.body}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No feedback written yet.</p>
          )}
          {feedback && (
            <p className="text-xs text-muted-foreground">
              {feedback.isSubmitted && feedback.submittedAt
                ? `Submitted on ${moment(feedback.submittedAt).format('MMM D, YYYY · h:mm A')}`
                : `Draft · last updated ${moment(feedback.updatedAt).fromNow()}`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionFeedbackView;
