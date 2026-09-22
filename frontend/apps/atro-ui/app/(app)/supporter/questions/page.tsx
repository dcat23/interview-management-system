import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { getClients } from '@feature/backend/server';
import { QuestionsBrowser } from '@app/atro-ui/components/supporter/questions-browser';

interface Props {
  searchParams: Promise<{ query?: string; clientId?: string; topic?: string }>;
}

async function AppSupporterQuestionsPage(props: Props) {
  const session = await auth();

  if (session?.user?.role !== 'supporter') {
    redirect('/login');
  }

  const { query, clientId, topic } = await props.searchParams;
  const clientsResponse = await getClients({ limit: 100, isActive: true, sort: 'name,asc' });

  return (
    <QuestionsBrowser
      clients={clientsResponse.data.data}
      initialQuery={query}
      initialClientId={clientId}
      initialTopic={topic}
    />
  );
}

export default AppSupporterQuestionsPage;
