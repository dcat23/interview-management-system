'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@feature/ui/components/ui/common/card';
import { Input } from '@feature/ui/components/ui/common/input';
import { Button } from '@feature/ui/components/ui/common/button';
import { Combobox, type ComboboxOption } from '@app/dashboard/components/combobox';
import { Download, Library, Loader2, Search } from 'lucide-react';
import { QuestionBankRow, QuestionBankRowSkeleton } from './question-bank-row';
import { getQuestions, exportQuestionsByTopic, type GetQuestionsResponse } from '@feature/backend/server';
import type { Client, Question } from '@feature/base/server';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_LIMIT = 20;
const INITIAL_SKELETON_COUNT = 6;
const NEXT_PAGE_SKELETON_COUNT = 3;
const GRID_CLASS = 'grid grid-cols-1 gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-3';

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'client'
  );
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface Props {
  clients: Client[];
  initialClientId?: string;
  initialQuery?: string;
}

export function QuestionsBrowser({ clients, initialClientId, initialQuery }: Props) {
  const clientOptions = useMemo<ComboboxOption[]>(
    () => clients.map((client) => ({ value: client.id, label: client.name })),
    [clients],
  );

  const [clientId, setClientId] = useState<string | undefined>(initialClientId);
  const [isExporting, startExportTransition] = useTransition();

  function handleExport() {
    if (isExporting) return;
    // Grouping by client only means something across multiple clients — once scoped to
    // one client (or the whole bank), "by topic" is the export that's actually useful, so
    // that's the only variant exposed here.
    const client = clientId ? clients.find((c) => c.id === clientId) : undefined;
    const label = client ? slugify(client.name) : 'all-clients';

    startExportTransition(async () => {
      const response = await exportQuestionsByTopic(clientId);
      if (response.success && response.data) {
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(`${label}-questions-by-topic-${date}.md`, response.data);
      } else {
        toast.error(response.message ?? 'Failed to export questions');
      }
    });
  }

  const [query, setQuery] = useState(initialQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState((initialQuery ?? '').trim());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  const queryClient = useQueryClient();
  const queryKey = ['questions-by-client', clientId, debouncedQuery] as const;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await getQuestions({
        clientId,
        q: debouncedQuery || undefined,
        page: pageParam,
        limit: PAGE_LIMIT,
      });
      if (!response.success) {
        toast.error(response.message ?? 'Failed to load questions');
      }
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page + 1) * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });

  const questions = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  function handleQuestionUpdated(updated: Question) {
    queryClient.setQueryData<InfiniteData<GetQuestionsResponse>>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((question) => (question.id === updated.id ? updated : question)),
        })),
      };
    });
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Library className="h-4 w-4 text-primary" />
          Question Bank
          <span className="font-mono text-xs font-normal text-muted-foreground">{total}</span>
        </CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" disabled={isExporting} onClick={handleExport}>
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export by Topic
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row">
        <Combobox
          options={clientOptions}
          value={clientId}
          onSelect={setClientId}
          placeholder="All clients"
          searchPlaceholder="Search clients..."
          className="sm:w-64"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search questions or topics..."
            className="pl-9 pr-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardContent>
      <CardContent className="px-0">
        {questions.length > 0 ? (
          <ul className={GRID_CLASS}>
            {questions.map((question) => (
              <li key={question.id} className="bg-card">
                <QuestionBankRow question={question} onQuestionUpdated={handleQuestionUpdated} />
              </li>
            ))}
            {isFetchingNextPage &&
              Array.from({ length: NEXT_PAGE_SKELETON_COUNT }).map((_, i) => (
                <li key={`next-page-skeleton-${i}`} className="bg-card">
                  <QuestionBankRowSkeleton />
                </li>
              ))}
          </ul>
        ) : isLoading ? (
          <ul className={GRID_CLASS}>
            {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
              <li key={`initial-skeleton-${i}`} className="bg-card">
                <QuestionBankRowSkeleton />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-4 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No questions match your filters.
          </p>
        )}
        <div ref={sentinelRef} aria-hidden className="h-px" />
      </CardContent>
    </Card>
  );
}

export default QuestionsBrowser;
