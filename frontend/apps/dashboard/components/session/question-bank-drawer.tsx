'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@feature/base-ui/components/ui/common/button';
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from '@feature/base-ui/components/ui/common/drawer';
import { Input } from '@feature/ui/components/ui/common/input';
import { Library, Loader2, Search } from 'lucide-react';
import { QuestionSearchResultRow } from './question-rows';
import { getQuestions, type GetQuestionsResponse } from '@feature/backend/server';
import type { Question } from '@feature/base/server';

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_LIMIT = 20;

interface Props {
  clientId: string;
  linkedIds: Set<string>;
  onLink: (questionId: string) => void;
  onQuestionsFetched: (questions: Question[]) => void;
}

export function QuestionBankDrawer({ clientId, linkedIds, onLink, onQuestionsFetched }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
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

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['question-bank', clientId, debouncedQuery],
    queryFn: async ({ pageParam }): Promise<GetQuestionsResponse> => {
      const response = await getQuestions({
        clientId,
        q: debouncedQuery || undefined,
        page: pageParam,
        limit: PAGE_LIMIT,
      });
      if (!response.success) {
        toast.error(response.message ?? 'Failed to search questions');
        return response.data;
      }
      onQuestionsFetched(response.data.data);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page + 1) * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    enabled: open,
  });

  const results = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!open || !node) return;

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
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Drawer position="right" onOpenChange={setOpen}>
      <DrawerTrigger render={<Button variant="outline" size="sm" />}>
        <Library className="h-3.5 w-3.5" />
        Question Bank
      </DrawerTrigger>
      <DrawerPopup variant="straight">
        <DrawerHeader>
          <DrawerTitle>Question Bank</DrawerTitle>
          <DrawerDescription>Search the bank and link questions to this session.</DrawerDescription>
        </DrawerHeader>
        <DrawerPanel className="space-y-3">
          <div className="relative">
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
          <div className="space-y-2">
            {results.length > 0 ? (
              <>
                {results.map((q) => (
                  <QuestionSearchResultRow key={q.id} question={q} linked={linkedIds.has(q.id)} onLink={onLink} />
                ))}
                <div ref={sentinelRef} aria-hidden className="h-px" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            ) : !isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No questions match &ldquo;{query}&rdquo;.
              </p>
            ) : null}
          </div>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}

export default QuestionBankDrawer;
