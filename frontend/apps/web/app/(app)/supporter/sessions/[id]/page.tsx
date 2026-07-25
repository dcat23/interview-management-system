import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@feature/ui/components/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { SessionSummaryHeader } from '@app/web/components/supporter/session-summary-header';
import { QuestionLinker } from '@app/web/components/supporter/question-linker';
import { sessions, getSessionById } from '@app/web/lib/data/sessions';

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
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Sessions
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <SessionSummaryHeader session={session} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/supporter/sessions/${session.id}/feedback`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {session.feedback.submitted ? 'View Feedback' : 'Write Feedback'}
          </Link>
        </Button>
      </div>

      <QuestionLinker initialLinkedIds={session.linkedQuestionIds} />
    </div>
  );
}
