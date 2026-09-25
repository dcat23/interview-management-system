'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpenIcon } from 'lucide-react';
import { getSessionQuestions } from '@feature/backend/server';
import type { InterviewSession } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/atro-ui/components/ui/common/dialog';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';

interface Props {
  session: InterviewSession;
}

/**
 * Read-only list of the questions linked to a session. Linking/unlinking is
 * supporter-only on the backend, so marketers get this instead of the
 * supporter's SessionQuestionsDialog.
 */
export function SessionQuestionsDialog({ session }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <BookOpenIcon />
          Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Session questions</DialogTitle>
          <DialogDescription>
            {session.candidateName ?? 'Unknown candidate'} &middot; {session.round}
          </DialogDescription>
        </DialogHeader>
        <QuestionList sessionId={session.id} />
      </DialogContent>
    </Dialog>
  );
}

interface QuestionListProps {
  sessionId: string;
}

// Separate component so the query only runs while the dialog is open.
function QuestionList({ sessionId }: QuestionListProps) {
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['session-questions', sessionId, 'read-only'],
    queryFn: async () => {
      const response = await getSessionQuestions(sessionId);
      if (!response.success) return [];
      return [...response.data].sort((a, b) => a.displayOrder - b.displayOrder);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions linked to this session yet.</p>;
  }

  return (
    <ol className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
      {questions.map((question, index) => (
        <li key={question.id} className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {index + 1}. {question.topic ?? 'Question'}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{question.body ?? '—'}</p>
          {question.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {question.notes}</p>}
        </li>
      ))}
    </ol>
  );
}

export default SessionQuestionsDialog;
