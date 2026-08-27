'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Input } from '@feature/ui/components/ui/common/input';
import { Skeleton } from '@feature/ui/components/ui/common/skeleton';
import { Textarea } from '@feature/ui/components/ui/common/textarea';
import { Button as PopoverButton } from '@feature/base-ui/components/ui/common/button';
import { Popover, PopoverPopup, PopoverTrigger } from '@feature/base-ui/components/ui/common/popover';
import { Pencil } from 'lucide-react';
import { updateQuestion } from '@feature/backend/server';
import { QuestionDetailDialog } from './question-detail-dialog';
import type { Question } from '@feature/base/server';

interface Props {
  question: Question;
  onQuestionUpdated: (question: Question) => void;
}

export function QuestionBankRow({ question, onQuestionUpdated }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [topic, setTopic] = useState(question.topic);
  const [body, setBody] = useState(question.body);
  const [isSaving, startSaveTransition] = useTransition();

  function handleEditOpenChange(next: boolean) {
    setEditOpen(next);
    if (next) {
      setTopic(question.topic);
      setBody(question.body);
    }
  }

  function handleSave() {
    const topicValue = topic.trim();
    const bodyValue = body.trim();
    if (!topicValue || !bodyValue) {
      toast.error('Topic and question text are required.');
      return;
    }
    startSaveTransition(async () => {
      const response = await updateQuestion(question.id, { topic: topicValue, body: bodyValue });
      if (response.success && response.data) {
        onQuestionUpdated(response.data);
        setEditOpen(false);
      } else {
        toast.error(response.message ?? 'Failed to update question');
      }
    });
  }

  return (
    <div className="flex items-start gap-3 p-4 sm:p-6">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {question.topic}
          </Badge>
          <span className="min-w-0 truncate text-[11px] text-muted-foreground" title={question.round}>
            {question.round}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed">{question.body}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <QuestionDetailDialog question={question} />
        <Popover open={editOpen} onOpenChange={handleEditOpenChange}>
          <PopoverTrigger
            render={
              <PopoverButton
                aria-label="Edit question"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
              />
            }
          >
            <Pencil className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverPopup align="end" className="w-72">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`topic-${question.id}`}>
                  Topic
                </label>
                <Input id={`topic-${question.id}`} value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`body-${question.id}`}>
                  Question
                </label>
                <Textarea
                  id={`body-${question.id}`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <PopoverButton variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={isSaving}>
                  Cancel
                </PopoverButton>
                <PopoverButton variant="default" size="sm" onClick={handleSave} loading={isSaving}>
                  Save
                </PopoverButton>
              </div>
            </div>
          </PopoverPopup>
        </Popover>
      </div>
    </div>
  );
}

/** Placeholder matching QuestionBankRow's shape, for the loading grid. */
export function QuestionBankRowSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-6">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Skeleton className="h-7 w-7" />
        <Skeleton className="h-7 w-7" />
      </div>
    </div>
  );
}

export default QuestionBankRow;
