'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Input } from '@feature/ui/components/input';
import { Search, ListChecks, Library } from 'lucide-react';
import { LinkedQuestionRow, QuestionSearchResultRow } from './question-rows';
import { linkQuestion, unlinkQuestion } from '@feature/backend/server';
import type { Question, SessionQuestion } from '@feature/base/server';

interface Props {
  sessionId: string;
  initialLinkedQuestions: SessionQuestion[];
  questionBank: Question[];
}

export function QuestionLinker({ sessionId, initialLinkedQuestions, questionBank }: Props) {
  const [linked, setLinked] = useState<SessionQuestion[]>(
    [...initialLinkedQuestions].sort((a, b) => a.displayOrder - b.displayOrder),
  );
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const questionById = useMemo(() => new Map(questionBank.map((q) => [q.id, q])), [questionBank]);
  const linkedIds = useMemo(() => new Set(linked.map((sq) => sq.questionId)), [linked]);

  const linkedQuestions = useMemo(
    () =>
      linked
        .map((sq) => ({ sessionQuestion: sq, question: questionById.get(sq.questionId) }))
        .filter((entry): entry is { sessionQuestion: SessionQuestion; question: Question } => Boolean(entry.question)),
    [linked, questionById],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questionBank;
    return questionBank.filter(
      (item) => item.body.toLowerCase().includes(q) || item.topic.toLowerCase().includes(q),
    );
  }, [query, questionBank]);

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
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left: linked questions */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            Questions Asked
            <span className="ml-auto font-mono text-sm font-normal text-muted-foreground">{linkedQuestions.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {linkedQuestions.length > 0 ? (
            linkedQuestions.map(({ sessionQuestion, question }) => (
              <LinkedQuestionRow
                key={question.id}
                question={question}
                order={sessionQuestion.displayOrder}
                onUnlink={unlink}
              />
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No questions linked yet. Add them from the question bank.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Right: question bank */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Library className="h-4 w-4 text-primary" />
            Question Bank
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions or topics..."
              className="pl-9"
            />
          </div>
          <div className="space-y-2">
            {results.length > 0 ? (
              results.map((q) => (
                <QuestionSearchResultRow
                  key={q.id}
                  question={q}
                  linked={linkedIds.has(q.id)}
                  onLink={link}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No questions match &ldquo;{query}&rdquo;.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
