import { QuestionLinker } from '@app/web/components/supporter/question-linker';
import { ModeBadge, StatusBadge } from '@app/web/components/supporter/session-badges';
import { SessionSummaryHeader } from '@app/web/components/supporter/session-summary-header';
import { getSessionById, sessions } from '@app/web/lib/data/sessions';
import { Button } from '@feature/ui/components/button';
import { ArrowLeft, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return sessions.map((session) => ({ id: session.id }));
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = getSessionById(id);

  if (!session) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/supporter/sessions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Sessions
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{session.candidateName}</h1>
          <StatusBadge status={session.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground">{session.technology}</p>
          <ModeBadge mode={session.mode} />
        </div>
      </div>

      <SessionSummaryHeader session={session} />

      <div className="flex justify-end border-t border-border pt-4">
        <Button asChild>
          <Link href={`/supporter/sessions/${session.id}/feedback`}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            {session.feedback.submitted ? "View Feedback" : "Provide Feedback"}
          </Link>
        </Button>
      </div>
      
      <QuestionLinker initialLinkedIds={session.linkedQuestionIds} />
    </div>
  );
}
