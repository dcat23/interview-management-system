'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, FileQuestionMark } from 'lucide-react';
import { Input } from '@feature/ui/components/input';
import { getClientById } from '@app/web/lib/data/clients';
import { bankQuestions, type BankQuestionTopic } from '@app/web/lib/data/questions';
import { QuestionRow } from '@app/web/components/supporter/question-row';
import { TopicFilterPills } from '@app/web/components/supporter/topic-filter-pills';
import { ActiveFilterChip } from '@app/web/components/supporter/active-filter-chip';
import { EmptyState } from '@app/web/components/supporter/empty-state';

export function QuestionsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientParam = searchParams.get('client');

  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<BankQuestionTopic | 'All'>('All');

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery), 250);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const activeClient = clientParam ? getClientById(clientParam) : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bankQuestions.filter((question) => {
      if (activeClient && question.clientId !== activeClient.id) return false;
      if (topic !== 'All' && question.topic !== topic) return false;
      if (!q) return true;
      return question.text.toLowerCase().includes(q) || question.topic.toLowerCase().includes(q);
    });
  }, [query, topic, activeClient]);

  function clearClientFilter() {
    router.replace('/supporter/questions');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Question Bank</h1>
        <p className="mt-1 text-muted-foreground">Browse questions across all clients</p>
      </div>

      <div className="space-y-4">
        <TopicFilterPills active={topic} onChange={setTopic} />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search questions or topics"
            className="pl-9"
            aria-label="Search questions"
          />
        </div>

        {activeClient && (
          <div className="flex items-center gap-2">
            <ActiveFilterChip label="Client" value={activeClient.name} onClear={clearClientFilter} />
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((question) => (
            <QuestionRow key={question.id} question={question} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileQuestionMark} title="No questions match your search" description="Try adjusting your filters" />
      )}
    </div>
  );
}
