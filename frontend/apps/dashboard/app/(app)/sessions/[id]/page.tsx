import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { QuestionLinker } from '@app/dashboard/components/session/question-linker';
import { ModeBadge } from '@app/dashboard/components/session/session-badges';
import { SessionSummaryHeader } from '@app/dashboard/components/session/session-summary-header';
import SessionStateToggleCard from '@app/dashboard/components/session/session-state-toggle-card';
import { DASHBOARD, SESSIONS } from '@feature/base/server';
import {
  getProcessById,
  getQuestions,
  getSessionById,
  getSessionQuestions,
} from '@feature/backend/server';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{}>;
}

async function AppSessionsIdPage(props: Props) {
  const { id } = await props.params;

  const sessionResponse = await getSessionById(id);
  if (sessionResponse.error) {
    throw sessionResponse.error;
  }
  if (!sessionResponse.success) {
    throw new Error(sessionResponse.message);
  }

  const session = sessionResponse.data;

  const [processResponse, linkedQuestionsResponse] = await Promise.all([
    getProcessById(session.processId),
    getSessionQuestions(session.id),
  ]);
  if (processResponse.error) {
    throw processResponse.error;
  }
  if (!processResponse.success) {
    throw new Error(processResponse.message);
  }

  const process = processResponse.data;
  const questionBankResponse = await getQuestions({ clientId: process.clientId, limit: 100 });

  const breadcrumbLabel = session.candidateName ?? 'Session';

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title={breadcrumbLabel}
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: SESSIONS.name, href: SESSIONS.href },
          { label: breadcrumbLabel, href: '#' },
        ]}
      >
        <div className="flex items-center gap-2">
          <ModeBadge mode={session.mode} />
          <SessionStateToggleCard session={session} />
        </div>
      </AppPageHeader>

      <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 px-4 lg:px-6">
        <SessionSummaryHeader session={session} clientId={process.clientId} />

        <QuestionLinker
          sessionId={session.id}
          clientId={process.clientId}
          initialLinkedQuestions={linkedQuestionsResponse.data}
          questionBank={questionBankResponse.data.data}
        />
      </div>
    </div>
  );
}

export default AppSessionsIdPage;
