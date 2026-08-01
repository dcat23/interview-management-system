'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@feature/ui/components/ui/common/card';
import { Input } from '@feature/ui/components/ui/common/input';
import { Loader2, Search, ListChecks, Library } from 'lucide-react';
import { LinkedQuestionRow, QuestionSearchResultRow } from './question-rows';
import { getQuestions, linkQuestion, unlinkQuestion } from '@feature/backend/server';
import type { Question, SessionQuestion } from '@feature/base/server';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 20;

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Question[]>(questionBank);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionByIdFromResults = useRef(new Map(questionBank.map((q) => [q.id, q])));

  const linkedIds = useMemo(() => new Set(linked.map((sq) => sq.questionId)), [linked]);

  const linkedQuestions = useMemo(
    () =>
      linked
        .map((sq) => ({ sessionQuestion: sq, question: questionByIdFromResults.current.get(sq.questionId) }))
        .filter((entry): entry is { sessionQuestion: SessionQuestion; question: Question } => Boolean(entry.question)),
    [linked],
  );

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const term = value.trim();
    if (!term) {
      setIsSearching(false);
      setResults(questionBank);
      return;
    }

    setIsSearching(true);
    searchTimer.current = setTimeout(async () => {
      const response = await getQuestions({ clientId, q: term, limit: SEARCH_RESULT_LIMIT });
      setIsSearching(false);
      if (response.success) {
        for (const question of response.data.data) {
          questionByIdFromResults.current.set(question.id, question);
        }
        setResults(response.data.data);
      } else {
        toast.error(response.message ?? 'Failed to search questions');
      }
    }, SEARCH_DEBOUNCE_MS);
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
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search questions or topics..."
              className="pl-9 pr-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
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
