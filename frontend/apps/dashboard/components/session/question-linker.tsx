'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@feature/ui/components/ui/common/card';
import { ListChecks } from 'lucide-react';
import { LinkedQuestionRow } from './question-rows';
import { QuestionBankDrawer } from './question-bank-drawer';
import { linkQuestion, unlinkQuestion } from '@feature/backend/server';
import type { Question, SessionQuestion } from '@feature/base/server';

interface Props {
  sessionId: string;
  clientId: string;
  initialLinkedQuestions: SessionQuestion[];
  questionBank: Question[];
}

export function QuestionLinker({ sessionId, clientId, initialLinkedQuestions, questionBank }: Props) {
  const [linked, setLinked] = useState<SessionQuestion[]>(
    [...initialLinkedQuestions].sort((a, b) => a.displayOrder - b.displayOrder),
  );
  const [isPending, startTransition] = useTransition();
  const questionById = useRef(new Map(questionBank.map((q) => [q.id, q])));
  // Bumped whenever questionById's contents change (search results, an edit) so the memo
  // below re-reads the ref — the ref itself isn't reactive.
  const [cacheVersion, setCacheVersion] = useState(0);

  const linkedIds = useMemo(() => new Set(linked.map((sq) => sq.questionId)), [linked]);

  const linkedQuestions = useMemo(
    () =>
      linked
        .map((sq) => ({ sessionQuestion: sq, question: questionById.current.get(sq.questionId) }))
        .filter((entry): entry is { sessionQuestion: SessionQuestion; question: Question } => Boolean(entry.question)),
    [linked, cacheVersion],
  );

  function registerQuestions(questions: Question[]) {
    for (const question of questions) {
      questionById.current.set(question.id, question);
    }
    setCacheVersion((v) => v + 1);
  }

  function updateQuestionInCache(question: Question) {
    questionById.current.set(question.id, question);
    setCacheVersion((v) => v + 1);
  }

  function link(questionId: string) {
    if (isPending || linkedIds.has(questionId)) return;
    startTransition(async () => {
      const response = await linkQuestion(sessionId, { questionId, displayOrder: linked.length + 1 });
      if (response.success && response.data) {
        setLinked((prev) => [...prev, response.data]);
      } else {
        toast.error(response.message ?? 'Failed to link question');
      }
    });
  }

  function unlink(questionId: string) {
    if (isPending) return;
    startTransition(async () => {
      const response = await unlinkQuestion({ sessionId, questionId });
      if (response.success) {
        setLinked((prev) => prev.filter((sq) => sq.questionId !== questionId));
      } else {
        toast.error(response.message ?? 'Failed to unlink question');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Questions Asked
          <span className="font-mono text-xs font-normal text-muted-foreground">{linkedQuestions.length}</span>
        </CardTitle>
        <CardAction>
          <QuestionBankDrawer
            clientId={clientId}
            linkedIds={linkedIds}
            onLink={link}
            onQuestionsFetched={registerQuestions}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {linkedQuestions.length > 0 ? (
          <ul className="grid grid-cols-1 gap-px overflow-hidden bg-border sm:grid-cols-2">
            {linkedQuestions.map(({ sessionQuestion, question }) => (
              <li key={question.id} className="bg-card">
                <LinkedQuestionRow
                  question={question}
                  order={sessionQuestion.displayOrder}
                  onUnlink={unlink}
                  onQuestionUpdated={updateQuestionInCache}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-4 my-4 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No questions linked yet. Add them from the question bank.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default QuestionLinker;
