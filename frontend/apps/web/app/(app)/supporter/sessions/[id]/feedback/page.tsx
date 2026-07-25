import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SessionSummaryHeader } from '@app/web/components/supporter/session-summary-header';
import { FeedbackEditor, FeedbackSubmitted } from '@app/web/components/supporter/feedback-editor';
import { sessions, getSessionById } from '@app/web/lib/data/sessions';

export function generateStaticParams() {
  return sessions.map((session) => ({ id: session.id }));
}

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSessionById(id);

  if (!session) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/supporter/sessions/${session.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Session
      </Link>
      
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{session.candidateName}</h1>
        <p className="mt-1 text-muted-foreground">
          {session.technology}
        </p>
      </div>

      <SessionSummaryHeader session={session} />

      {session.feedback.submitted ? (
        <FeedbackSubmitted feedback={session.feedback} />
      ) : (
        <FeedbackEditor initialContent={session.feedback.content} />
      )}
    </div>
  );
}
