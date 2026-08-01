'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Button } from '@feature/ui/components/button';
import { Textarea } from '@feature/ui/components/textarea';
import { Badge } from '@feature/ui/components/badge';
import { Check, Loader2, Lock, MessageSquare, Send } from 'lucide-react';
import { ConfirmDialog } from './confirm-dialog';
import { createFeedback, updateFeedback } from '@feature/backend/server';
import type { Feedback } from '@feature/base/server';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 700;

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ReadOnlyProps {
  body: string;
  isSubmitted: boolean;
  submittedAt: string | null;
}

// Used both for another supporter's feedback (view-all) and for the
// authoring supporter's own feedback once it's been submitted (locked).
export function FeedbackReadOnly({ body, isSubmitted, submittedAt }: ReadOnlyProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Feedback
          </CardTitle>
          {isSubmitted ? (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              <Check className="mr-1 h-3 w-3" />
              Submitted
            </Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {body ? (
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
            {body}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No feedback written yet.</p>
        )}
        {submittedAt && (
          <p className="text-xs text-muted-foreground">Submitted on {formatTimestamp(submittedAt)}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface Props {
  sessionId: string;
  feedback: Feedback | null;
  isOwnFeedback: boolean;
}

export function FeedbackEditor({ sessionId, feedback, isOwnFeedback }: Props) {
  const [feedbackId, setFeedbackId] = useState<string | null>(feedback?.id ?? null);
  const [content, setContent] = useState(feedback?.body ?? '');
  const [submitted, setSubmitted] = useState(feedback?.isSubmitted ?? false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(feedback?.submittedAt ?? null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);
  const feedbackIdRef = useRef(feedbackId);

  useEffect(() => {
    feedbackIdRef.current = feedbackId;
  }, [feedbackId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function persist(body: string) {
    setSaveStatus('saving');
    const response = feedbackIdRef.current
      ? await updateFeedback(sessionId, { body })
      : await createFeedback(sessionId, { body });

    if (response.success && response.data) {
      setFeedbackId(response.data.id);
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
      toast.error(response.message ?? 'Failed to save feedback');
    }
  }

  function handleChange(value: string) {
    setContent(value);
    latestContent.current = value;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (value.trim().length === 0) return;
    saveTimer.current = setTimeout(() => {
      void persist(latestContent.current);
    }, SAVE_DEBOUNCE_MS);
  }

  async function handleSubmit() {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    let currentId = feedbackIdRef.current;
    if (!currentId) {
      const created = await createFeedback(sessionId, { body: content });
      if (!created.success || !created.data) {
        toast.error(created.message ?? 'Failed to save feedback before submitting');
        return;
      }
      currentId = created.data.id;
      setFeedbackId(currentId);
    } else if (content !== (feedback?.body ?? '')) {
      // Flush any unsaved edits before locking the record.
      await updateFeedback(sessionId, { body: content });
    }

    const response = await updateFeedback(sessionId, { isSubmitted: true });
    if (response.success && response.data) {
      setSubmitted(true);
      setSubmittedAt(response.data.submittedAt);
    } else {
      toast.error(response.message ?? 'Failed to submit feedback');
    }
  }

  if (!isOwnFeedback || submitted) {
    return <FeedbackReadOnly body={content} isSubmitted={submitted} submittedAt={submittedAt} />;
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-primary" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your feedback for this interview session..."
            className="min-h-48 resize-y leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving&hellip;
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Saved
                </>
              )}
              {saveStatus === 'error' && <span className="text-destructive">Failed to save</span>}
            </div>

            <Button onClick={() => setConfirmOpen(true)} disabled={content.trim().length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit feedback?"
        description="This can't be edited afterward. Make sure your feedback is complete before submitting."
        confirmLabel="Submit"
        onConfirm={handleSubmit}
      />
    </>
  );
}
