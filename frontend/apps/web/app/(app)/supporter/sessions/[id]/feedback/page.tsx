import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@feature/auth/server';
import { getFeedback, getSessionById } from '@feature/backend/server';
import { buildSessionCards } from '@app/web/lib/supporter/session-cards';
import { SessionSummaryHeader } from '@app/web/components/supporter/session-summary-header';
import { StatusBadge } from '@app/web/components/supporter/session-badges';
import { FeedbackEditor } from '@app/web/components/supporter/feedback-editor';

async function loadFeedbackPageData(sessionId: string) {
  const [authSession, sessionResult] = await Promise.all([auth(), getSessionById(sessionId)]);
  if (!sessionResult.data.id) return null;

  const [sessionCards, feedbackResult] = await Promise.all([
    buildSessionCards([sessionResult.data]),
    getFeedback(sessionId),
  ]);

  // 404 just means no feedback has been written yet — not an error.
  const feedback = feedbackResult.success ? feedbackResult.data : null;
  const currentUserId = authSession?.user?.id ?? null;
  const isOwnFeedback = feedback
    ? feedback.supporterId === currentUserId
    : sessionResult.data.supporterId === currentUserId;

  return {
    session: sessionCards[0],
    feedback,
    isOwnFeedback,
  };
}

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await loadFeedbackPageData(id);

  if (!detail) {
    notFound();
  }

  const { session, feedback, isOwnFeedback } = detail;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/supporter/sessions/${session.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Session
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{session.candidateName}</h1>
          <StatusBadge status={session.status} />
        </div>
        <p className="text-muted-foreground">{session.technology}</p>
      </div>

      <SessionSummaryHeader session={session} />

      <FeedbackEditor sessionId={session.id} feedback={feedback} isOwnFeedback={isOwnFeedback} />
    </div>
  );
}
