import { Suspense } from 'react';
import { getClients, getQuestions } from '@feature/backend/server';
import { QuestionsBrowser } from '@app/web/components/supporter/questions-browser';
import QuestionsLoading from './loading';

// No pagination UI on this page yet — fetch a generously large page so the
// "all questions" browse view is effectively complete for current data volumes.
const MAX = 100;

async function SupporterQuestionsPage() {
  const [{ data: questionPage }, { data: clientPage }] = await Promise.all([
    getQuestions({ limit: MAX }),
    getClients({ limit: MAX }),
  ]);

  return (
    <Suspense fallback={<QuestionsLoading />}>
      <QuestionsBrowser questions={questionPage.data} clients={clientPage.data} />
    </Suspense>
  );
}

export default SupporterQuestionsPage;
