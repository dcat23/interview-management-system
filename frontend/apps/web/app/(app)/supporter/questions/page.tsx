import { Suspense } from 'react';
import { QuestionsBrowser } from '@app/web/components/supporter/questions-browser';
import QuestionsLoading from './loading';

function SupporterQuestionsPage() {
  return (
    <Suspense fallback={<QuestionsLoading />}>
      <QuestionsBrowser />
    </Suspense>
  );
}

export default SupporterQuestionsPage;
