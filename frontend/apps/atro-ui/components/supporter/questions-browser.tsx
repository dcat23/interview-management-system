'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpenIcon, DownloadIcon, Loader2Icon, SearchIcon } from 'lucide-react';
import { getQuestions, exportQuestionsByClient, exportQuestionsByTopic } from '@feature/backend/server';
import type { Client } from '@feature/base/server';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Input } from '@app/atro-ui/components/ui/common/input';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import { QuestionDetailDialog } from './question-detail-dialog';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_LIMIT = 20;
const INITIAL_SKELETON_COUNT = 8;
const NEXT_PAGE_SKELETON_COUNT = 3;

const CONTENT = {
  stamp: 'Question Bank',
  headlineBefore: 'Prep with the',
  headlineAccent: 'question bank',
  headlineAfter: '.',
  lede: 'Search by topic or keyword to pull up interview questions before a session.',
};

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
  initialQuery?: string;
  initialClientId?: string;
  initialTopic?: string;
}

export function QuestionsBrowser({ clients, initialQuery, initialClientId, initialTopic }: Props) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState((initialQuery ?? '').trim());
  const queryDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [topic, setTopic] = useState(initialTopic ?? '');
  const [debouncedTopic, setDebouncedTopic] = useState((initialTopic ?? '').trim());
  const topicDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clientId, setClientId] = useState(initialClientId ?? '');
  const [isExporting, startExportTransition] = useTransition();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (queryDebounceTimer.current) clearTimeout(queryDebounceTimer.current);
      if (topicDebounceTimer.current) clearTimeout(topicDebounceTimer.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (queryDebounceTimer.current) clearTimeout(queryDebounceTimer.current);
    queryDebounceTimer.current = setTimeout(() => setDebouncedQuery(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  function handleTopicChange(value: string) {
    setTopic(value);
    if (topicDebounceTimer.current) clearTimeout(topicDebounceTimer.current);
    topicDebounceTimer.current = setTimeout(() => setDebouncedTopic(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  // The backend's full-text `q` search already covers topic + body, and ignores `topic`
  // whenever `q` is present (see getQuestions in @feature/backend/server) — so the topic
  // filter only takes effect once the free-text search box is empty.
  const topicFilterActive = !debouncedQuery && !!debouncedTopic;

  const selectedClient = clientId ? clients.find((c) => c.id === clientId) : undefined;

  // Export only understands the client filter — it has no `q`/`topic` params on the backend
  // (see QuestionExportService.exportByClient/exportByTopic) — so it exports the active
  // question bank for the selected client (or all clients), grouped the way the dashboard's
  // question browser does: by topic once scoped to one client, otherwise by client.
  function handleExport() {
    if (isExporting) return;
    const label = selectedClient ? slugify(selectedClient.name) : 'all-clients';
    const suffix = selectedClient ? 'questions-by-topic' : 'questions-by-client';

    startExportTransition(async () => {
      const response = selectedClient
        ? await exportQuestionsByTopic(clientId)
        : await exportQuestionsByClient(undefined);
      if (response.success && response.data) {
        const date = new Date().toISOString().slice(0, 10);
        downloadMarkdown(`${label}-${suffix}-${date}.md`, response.data);
      } else {
        toast.error(response.message ?? 'Failed to export questions');
      }
    });
  }

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['supporter-questions', debouncedQuery, clientId, debouncedTopic],
    queryFn: async ({ pageParam }) => {
      const response = await getQuestions({
        q: debouncedQuery || undefined,
        clientId: clientId || undefined,
        topic: debouncedTopic || undefined,
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

  const questions = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

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
    <section className="flex flex-col">
      <div className="border-b border-border">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {CONTENT.stamp}
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {CONTENT.headlineBefore}{' '}
            <span className="italic text-primary">{CONTENT.headlineAccent}</span>
            {CONTENT.headlineAfter}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {CONTENT.lede}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-start gap-3 pb-6">
          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search questions or topics..."
              className="h-9 pl-9 pr-9"
            />
            {isLoading && (
              <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            aria-label="Filter by client"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <div className="w-full max-w-xs">
            <Input
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              placeholder="Filter by topic..."
              disabled={!!debouncedQuery}
              className="h-9"
            />
            {!topicFilterActive && debouncedTopic && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Clear the search box to filter by topic.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 py-4">
        <BookOpenIcon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Results</span>
        <span className="font-mono text-xs text-muted-foreground">{total}</span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={isExporting}
          onClick={handleExport}
        >
          {isExporting ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
          {selectedClient ? 'Export by Topic' : 'Export by Client'}
        </Button>
      </div>

      {questions.length > 0 ? (
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {questions.map((question, i) => (
            <li key={question.id} className="bg-background p-6">
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </p>
              <div className="mt-3 flex min-w-0 items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {question.topic}
                </Badge>
                <span className="min-w-0 truncate text-[11px] text-muted-foreground" title={question.round}>
                  {question.round}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground">{question.body}</p>
              <div className="mt-3">
                <QuestionDetailDialog question={question} />
              </div>
            </li>
          ))}
          {isFetchingNextPage &&
            Array.from({ length: NEXT_PAGE_SKELETON_COUNT }).map((_, i) => (
              <li key={`next-page-skeleton-${i}`} className="bg-background p-6">
                <QuestionCardSkeleton />
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
            <li key={`initial-skeleton-${i}`} className="bg-background p-6">
              <QuestionCardSkeleton />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No questions match your search.
        </p>
      )}
      <div ref={sentinelRef} aria-hidden className="h-px" />
    </section>
  );
}

function QuestionCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-6" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default QuestionsBrowser;
