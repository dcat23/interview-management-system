import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, Clock, TableProperties } from 'lucide-react';
import { Card, CardContent } from '@feature/ui/components/card';
import { FeedbackEditor, FeedbackSubmitted } from '@app/web/components/supporter/feedback-editor';
import { sessions, getSessionById } from '@app/web/lib/data/sessions';

// This page is still backed by mock data — the feedback API (GET/POST/PATCH
// /sessions/:id/feedback) hasn't been built on the backend yet, so it can't
// be wired to real data the way the sessions list/detail pages were. It no
// longer reuses SessionSummaryHeader (now typed to the real, wired
// InterviewSession shape) to keep this mock path self-contained until the
// feedback story ships.

export function generateStaticParams() {
  return sessions.map((session) => ({ id: session.id }));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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

      <Card className="bg-card">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {formatDate(session.date)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {session.time}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {session.clientName}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TableProperties className="h-4 w-4 text-muted-foreground" />
            Round {session.round}
          </div>
        </CardContent>
      </Card>

      {session.feedback.submitted ? (
        <FeedbackSubmitted feedback={session.feedback} />
      ) : (
        <FeedbackEditor initialContent={session.feedback.content} />
      )}
    </div>
  );
}
