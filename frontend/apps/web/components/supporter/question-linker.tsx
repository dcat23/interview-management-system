'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Input } from '@feature/ui/components/input';
import { Search, ListChecks, Library } from 'lucide-react';
import { LinkedQuestionRow, QuestionSearchResultRow } from './question-rows';
import { questionBank, getQuestionById } from '@app/web/lib/data/sessions';

export function QuestionLinker({ initialLinkedIds }: { initialLinkedIds: string[] }) {
  const [linkedIds, setLinkedIds] = useState<string[]>(initialLinkedIds);
  const [query, setQuery] = useState('');

  const linkedQuestions = useMemo(
    () => linkedIds.map((id) => getQuestionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)),
    [linkedIds],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questionBank;
    return questionBank.filter(
      (item) => item.text.toLowerCase().includes(q) || item.topic.toLowerCase().includes(q),
    );
  }, [query]);

  function link(id: string) {
    setLinkedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function unlink(id: string) {
    setLinkedIds((prev) => prev.filter((x) => x !== id));
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
            linkedQuestions.map((q, index) => (
              <LinkedQuestionRow key={q.id} question={q} order={index + 1} onUnlink={unlink} />
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
                  linked={linkedIds.includes(q.id)}
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
