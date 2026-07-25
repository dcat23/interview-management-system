'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@feature/ui/components/card';
import { Button } from '@feature/ui/components/button';
import { Textarea } from '@feature/ui/components/textarea';
import { Badge } from '@feature/ui/components/badge';
import { Check, Loader2, Lock, MessageSquare, Send } from 'lucide-react';
import { ConfirmDialog } from './confirm-dialog';
import type { FeedbackState } from '@app/web/lib/data/sessions';

type SaveStatus = 'idle' | 'saving' | 'saved';

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function FeedbackSubmitted({ feedback }: { feedback: FeedbackState }) {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Feedback
          </CardTitle>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm leading-relaxed">
          {feedback.content}
        </p>
        {feedback.submittedAt && (
          <p className="text-xs text-muted-foreground">Submitted on {formatTimestamp(feedback.submittedAt)}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FeedbackEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleChange(value: string) {
    setContent(value);
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus('saved'), 700);
  }

  function handleSubmit() {
    setSubmitted(true);
    setSubmittedAt(new Date().toISOString());
  }

  if (submitted) {
    return <FeedbackSubmitted feedback={{ submitted: true, content, submittedAt }} />;
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
