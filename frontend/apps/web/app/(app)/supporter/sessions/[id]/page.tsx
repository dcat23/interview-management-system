import { QuestionLinker } from '@app/web/components/supporter/question-linker';
import { ModeBadge, StatusBadge } from '@app/web/components/supporter/session-badges';
import { SessionSummaryHeader } from '@app/web/components/supporter/session-summary-header';
import type { SessionCardData } from '@app/web/components/supporter/session-card';
import {
  getCandidateById,
  getClients,
  getProcessById,
  getQuestions,
  getSessionById,
  getSessionQuestions,
} from '@feature/backend/server';
import { Button } from '@feature/ui/components/button';
import { ArrowLeft, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function loadSessionDetail(sessionId: string) {
  const { data: session } = await getSessionById(sessionId);
  if (!session.id) return null;

  const [processResult, clientsResult, linkedQuestionsResult] = await Promise.all([
    getProcessById(session.processId),
    getClients({ limit: 100 }),
    getSessionQuestions(sessionId),
  ]);
  const process = processResult.data;
  const client = clientsResult.data.data.find((c) => c.id === process.clientId);

  const [candidateResult, questionBankResult] = await Promise.all([
    getCandidateById(process.candidateId),
    getQuestions({ clientId: process.clientId, limit: 100 }),
  ]);

  const sessionCard: SessionCardData = {
    ...session,
    candidateName: candidateResult.data.name ?? 'Unknown candidate',
    clientName: client?.name ?? 'Unknown client',
    technology: process.technology,
  };

  return {
    session: sessionCard,
    clientId: process.clientId,
    linkedQuestions: linkedQuestionsResult.data,
    questionBank: questionBankResult.data.data,
  };
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await loadSessionDetail(id);

  if (!detail) {
    notFound();
  }

  const { session, clientId, linkedQuestions, questionBank } = detail;

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
            Provide Feedback
          </Link>
        </Button>
      </div>

      <QuestionLinker
        sessionId={session.id}
        clientId={clientId}
        initialLinkedQuestions={linkedQuestions}
        questionBank={questionBank}
      />
    </div>
  );
}
