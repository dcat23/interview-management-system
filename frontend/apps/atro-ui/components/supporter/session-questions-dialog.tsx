'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type Dispatch, type SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpenIcon, Loader2Icon, PlusIcon, SearchIcon } from 'lucide-react';
import type { InterviewSession, Question, SessionQuestion } from '@feature/base/server';
import {
  bulkCreateSessionQuestions,
  getQuestionById,
  getQuestions,
  getSessionQuestions,
  linkQuestion,
  unlinkQuestion,
} from '@feature/backend/server';
import { useClients } from '@feature/backend/hooks/client/use-clients';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/atro-ui/components/ui/common/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/atro-ui/components/ui/common/tabs';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Input } from '@app/atro-ui/components/ui/common/input';
import { Textarea } from '@app/atro-ui/components/ui/common/textarea';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { SortableList, SortableListItem, type Item } from '@app/atro-ui/components/ui/common/sortable-list';

const SEARCH_DEBOUNCE_MS = 300;

type LinkedItem = Item & { sessionQuestion: SessionQuestion; question: Question };

interface Props {
  session: InterviewSession;
}

export function SessionQuestionsDialog({ session }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LinkedItem[]>([]);
  const seededRef = useRef(false);
  const idMapRef = useRef(new Map<string, number>());
  const nextIdRef = useRef(1);

  const [isMutating, startMutation] = useTransition();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');

  const { data: clientsPage } = useClients();
  const clientId = useMemo(
    () => clientsPage?.data.find((c) => c.name === session.clientName)?.id,
    [clientsPage, session.clientName],
  );

  function numericIdFor(questionId: string) {
    let id = idMapRef.current.get(questionId);
    if (id === undefined) {
      id = nextIdRef.current++;
      idMapRef.current.set(questionId, id);
    }
    return id;
  }

  function toItem(sessionQuestion: SessionQuestion, question: Question): LinkedItem {
    return {
      id: numericIdFor(question.id),
      text: question.topic,
      checked: false,
      description: question.body,
      sessionQuestion,
      question,
    };
  }

  const sessionQuestionsQuery = useQuery({
    queryKey: ['session-questions', session.id],
    queryFn: async () => {
      const response = await getSessionQuestions(session.id);
      if (!response.success) {
        toast.error(response.message ?? 'Failed to load linked questions');
        return [];
      }
      const sorted = [...response.data].sort((a, b) => a.displayOrder - b.displayOrder);
      const questions = await Promise.all(sorted.map((sq) => getQuestionById(sq.questionId)));
      return sorted
        .map((sq, i) => ({ sessionQuestion: sq, question: questions[i]?.success ? questions[i].data : null }))
        .filter(
          (entry): entry is { sessionQuestion: SessionQuestion; question: Question } => entry.question !== null,
        );
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && sessionQuestionsQuery.data && !seededRef.current) {
      seededRef.current = true;
      setItems(sessionQuestionsQuery.data.map(({ sessionQuestion, question }) => toItem(sessionQuestion, question)));
    }
  }, [open, sessionQuestionsQuery.data]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      seededRef.current = false;
      setItems([]);
      setQuery('');
      setDebouncedQuery('');
      setBody('');
      setNotes('');
    }
  }

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(value.trim()), SEARCH_DEBOUNCE_MS);
  }

  const searchQuery = useQuery({
    queryKey: ['session-question-search', clientId, debouncedQuery],
    queryFn: async () => {
      const response = await getQuestions({ clientId, q: debouncedQuery || undefined, limit: 20 });
      if (!response.success) {
        toast.error(response.message ?? 'Failed to search questions');
      }
      return response.data.data;
    },
    enabled: open,
  });

  const linkedQuestionIds = useMemo(() => new Set(items.map((item) => item.sessionQuestion.questionId)), [items]);

  function handleCompleteItem(id: number) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }

  function handleUnlink(item: LinkedItem) {
    startMutation(async () => {
      const response = await unlinkQuestion({ sessionId: session.id, questionId: item.sessionQuestion.questionId });
      if (!response.success) {
        toast.error(response.message ?? 'Failed to remove question');
        setItems((prev) =>
          [...prev, item].sort((a, b) => a.sessionQuestion.displayOrder - b.sessionQuestion.displayOrder),
        );
      }
    });
  }

  // SortableList's internal trash-button handler filters its `items` state directly via
  // `setItems` (see sortable-list.tsx) — intercepting the setter here is the only hook point
  // to notice a removal and fire the matching unlink call against the backend.
  const handleItemsChange: Dispatch<SetStateAction<Item[]>> = (action) => {
    setItems((prev) => {
      const next = (typeof action === 'function' ? (action as (p: Item[]) => Item[])(prev) : action) as LinkedItem[];
      const nextIds = new Set(next.map((item) => item.id));
      for (const item of prev) {
        if (!nextIds.has(item.id)) handleUnlink(item);
      }
      return next;
    });
  };

  function handleLink(question: Question) {
    if (isMutating || linkedQuestionIds.has(question.id)) return;
    startMutation(async () => {
      const response = await linkQuestion(session.id, { questionId: question.id, displayOrder: items.length + 1 });
      if (response.success && response.data) {
        setItems((prev) => [...prev, toItem(response.data, question)]);
        toast.success('Question linked to session');
      } else {
        toast.error(response.message ?? 'Failed to link question');
      }
    });
  }

  function handleCreate() {
    const bodyValue = body.trim();
    if (!bodyValue) {
      toast.error('Question text is required.');
      return;
    }
    if (!clientId) {
      toast.error('Could not resolve the client for this session.');
      return;
    }
    startMutation(async () => {
      const response = await bulkCreateSessionQuestions(session.id, {
        questions: [
          {
            clientId,
            topic: session.technology || 'General',
            round: session.round,
            body: bodyValue,
            notes: notes.trim() || undefined,
            displayOrder: items.length + 1,
          },
        ],
      });
      const result = response.data?.results[0];
      if (response.success && result?.outcome === 'CREATED' && result.questionId && result.sessionQuestionId) {
        const questionResponse = await getQuestionById(result.questionId);
        if (questionResponse.success) {
          const sessionQuestion: SessionQuestion = {
            id: result.sessionQuestionId,
            sessionId: session.id,
            questionId: result.questionId,
            displayOrder: items.length + 1,
            notes: notes.trim() || null,
            createdAt: new Date().toISOString(),
          };
          setItems((prev) => [...prev, toItem(sessionQuestion, questionResponse.data)]);
        }
        setBody('');
        setNotes('');
        toast.success('Question added to session');
      } else {
        toast.error(result?.error ?? response.message ?? 'Failed to create question');
      }
    });
  }

  function renderItem(
    item: Item,
    order: number,
    onCompleteItem: (id: number) => void,
    onRemoveItem: (id: number) => void,
  ) {
    return (
      <SortableListItem
        key={item.id}
        item={item}
        order={order}
        onCompleteItem={onCompleteItem}
        onRemoveItem={onRemoveItem}
        handleDrag={() => undefined}
        className="my-2"
      />
    );
  }

  const results = searchQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <BookOpenIcon />
          Questions
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Interview questions</DialogTitle>
          <DialogDescription>
            {session.candidateName ?? 'This session'} &middot; {session.round}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 pb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Linked questions
            </span>
            <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
          </div>

          {sessionQuestionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : items.length > 0 ? (
            <SortableList
              items={items}
              setItems={handleItemsChange}
              onCompleteItem={handleCompleteItem}
              renderItem={renderItem}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
              No questions linked yet. Add some below.
            </p>
          )}

          <Tabs defaultValue="create" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">
                Add question
              </TabsTrigger>
              <TabsTrigger value="search" className="flex-1">
                Search bank
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex flex-col gap-3 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="new-question-body">
                  Question
                </label>
                <Textarea
                  id="new-question-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What would you like to ask?"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="new-question-notes">
                  Description
                </label>
                <Textarea
                  id="new-question-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for this session (optional)"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="self-end"
                disabled={isMutating || !body.trim()}
                onClick={handleCreate}
              >
                {isMutating ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                Add to session
              </Button>
            </TabsContent>

            <TabsContent value="search" className="flex flex-col gap-3 pt-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                {searchQuery.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : results.length > 0 ? (
                  results.map((question) => {
                    const linked = linkedQuestionIds.has(question.id);
                    return (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {question.topic}
                          </Badge>
                          <p className="line-clamp-2 text-sm leading-relaxed">{question.body}</p>
                        </div>
                        <Button
                          type="button"
                          variant={linked ? 'secondary' : 'outline'}
                          size="sm"
                          className="shrink-0"
                          disabled={linked || isMutating}
                          onClick={() => handleLink(question)}
                        >
                          {linked ? 'Linked' : (
                            <>
                              <PlusIcon />
                              Link
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">No questions match your search.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SessionQuestionsDialog;
