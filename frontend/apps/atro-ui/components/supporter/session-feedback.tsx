'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { CheckIcon, Loader2Icon, LockIcon, MessageSquareIcon, SendIcon, SparklesIcon } from 'lucide-react';

import { createFeedback, getFeedback, updateFeedback } from '@feature/backend/server';
import type { InterviewSession } from '@feature/base/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@app/atro-ui/components/ui/common/card';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Textarea } from '@app/atro-ui/components/ui/common/textarea';
import { Input } from '@app/atro-ui/components/ui/common/input';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';

const SAVE_DEBOUNCE_MS = 700;

interface Props {
  session: InterviewSession;
}

export function SessionFeedback({ session }: Props) {
  const { data: authSession } = useSession();
  const currentUserId = authSession?.user?.id ?? null;
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['feedback', session.id],
    queryFn: () => getFeedback(session.id),
  });

  const feedback = response?.success ? response.data : null;
  const isOwnFeedback = feedback
    ? feedback.supporterId === currentUserId
    : session.supporterId === currentUserId;

  const [content, setContent] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef<string | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || isLoading) return;
    hydrated.current = true;
    setContent(feedback?.body ?? '');
    setFeedbackId(feedback?.id ?? null);
    feedbackIdRef.current = feedback?.id ?? null;
    setSubmitted(feedback?.isSubmitted ?? false);
    setSubmittedAt(feedback?.submittedAt ?? null);
  }, [isLoading, feedback]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function persist(body: string) {
    setSaveStatus('saving');
    const result = feedbackIdRef.current
      ? await updateFeedback(session.id, { body })
      : await createFeedback(session.id, { body });

    if (result.success && result.data) {
      feedbackIdRef.current = result.data.id;
      setFeedbackId(result.data.id);
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
      toast.error(result.message ?? 'Failed to save feedback');
    }
  }

  function handleChange(value: string) {
    setContent(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (value.trim().length === 0) return;
    saveTimer.current = setTimeout(() => void persist(value), SAVE_DEBOUNCE_MS);
  }

  async function handleSubmit() {
    if (saveTimer.current) clearTimeout(saveTimer.current);

    let currentId = feedbackIdRef.current;
    if (!currentId) {
      const created = await createFeedback(session.id, { body: content });
      if (!created.success || !created.data) {
        toast.error(created.message ?? 'Failed to save feedback before submitting');
        return;
      }
      currentId = created.data.id;
      feedbackIdRef.current = currentId;
      setFeedbackId(currentId);
    } else if (content !== (feedback?.body ?? '')) {
      await updateFeedback(session.id, { body: content });
    }

    const result = await updateFeedback(session.id, { isSubmitted: true });
    if (result.success && result.data) {
      setSubmitted(true);
      setSubmittedAt(result.data.submittedAt);
      void queryClient.invalidateQueries({ queryKey: ['feedback', session.id] });
    } else {
      toast.error(result.message ?? 'Failed to submit feedback');
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {submitted || !isOwnFeedback ? (
              <LockIcon className="h-4 w-4 text-primary" />
            ) : (
              <MessageSquareIcon className="h-4 w-4 text-primary" />
            )}
            Feedback
            {submitted && (
              <Badge variant="soft" className="ml-auto">
                <CheckIcon className="h-3 w-3" />
                Submitted
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !isOwnFeedback || submitted ? (
            content ? (
              <p className="rounded-lg border border-border bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback written yet.</p>
            )
          ) : (
            <>
              <Textarea
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Write your feedback for this interview session..."
                className="min-h-32 resize-y leading-relaxed"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      Saving&hellip;
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                      Saved
                    </>
                  )}
                  {saveStatus === 'error' && <span className="text-destructive">Failed to save</span>}
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={content.trim().length === 0}
                >
                  <SendIcon />
                  Submit
                </Button>
              </div>
            </>
          )}
          {submittedAt && (
            <p className="text-xs text-muted-foreground">
              Submitted on {new Date(submittedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Feedback assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
            <p>Chat with an assistant to help draft feedback.</p>
            <p className="text-xs">Coming soon</p>
          </div>
          <div className="flex items-center gap-2">
            <Input disabled placeholder="Ask the assistant..." className="flex-1" />
            <Button size="icon" disabled title="Coming soon">
              <SendIcon />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionFeedback;
