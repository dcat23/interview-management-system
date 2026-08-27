'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Button } from '@feature/ui/components/ui/common/button';
import { Input } from '@feature/ui/components/ui/common/input';
import { Textarea } from '@feature/ui/components/ui/common/textarea';
import { Button as PopoverButton } from '@feature/base-ui/components/ui/common/button';
import { Popover, PopoverPopup, PopoverTrigger } from '@feature/base-ui/components/ui/common/popover';
import { HelpCircle, Pencil, Plus, TriangleAlert, X } from 'lucide-react';
import { updateQuestion } from '@feature/backend/server';
import type { Question } from '@feature/base/server';

interface LinkedQuestionRowProps {
  question: Question;
  order: number;
  onUnlink: (id: string) => void;
  onQuestionUpdated: (question: Question) => void;
}

export function LinkedQuestionRow({ question, order, onUnlink, onQuestionUpdated }: LinkedQuestionRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [topic, setTopic] = useState(question.topic);
  const [body, setBody] = useState(question.body);
  const [isSaving, startSaveTransition] = useTransition();

  const [confirmOpen, setConfirmOpen] = useState(false);

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
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
        {String(order).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Badge variant="outline" className="text-[10px]">
          {question.topic}
        </Badge>
        <p className="line-clamp-2 text-sm leading-relaxed">{question.body}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
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

        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverTrigger
            render={
              <PopoverButton
                aria-label="Unlink question"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              />
            }
          >
            <X className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverPopup align="end" className="w-64">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed">
                  Remove this question from the session? You can re-link it later from the question bank.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <PopoverButton variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </PopoverButton>
                <PopoverButton
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onUnlink(question.id);
                    setConfirmOpen(false);
                  }}
                >
                  Unlink
                </PopoverButton>
              </div>
            </div>
          </PopoverPopup>
        </Popover>
      </div>
    </div>
  );
}

interface QuestionSearchResultRowProps {
  question: Question;
  linked: boolean;
  onLink: (id: string) => void;
}

export function QuestionSearchResultRow({ question, linked, onLink }: QuestionSearchResultRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <HelpCircle className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Badge variant="outline" className="text-[10px]">
          {question.topic}
        </Badge>
        <p className="line-clamp-2 text-sm leading-relaxed">{question.body}</p>
      </div>
      <Button
        variant={linked ? 'secondary' : 'outline'}
        size="sm"
        className="shrink-0"
        disabled={linked}
        onClick={() => onLink(question.id)}
      >
        {linked ? (
          'Linked'
        ) : (
          <>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Link
          </>
        )}
      </Button>
    </div>
  );
}
