import { QuestionsBrowser } from '@app/dashboard/components/questions/questions-browser';
import { getClients } from '@feature/backend/server';

interface Props {
  searchParams: Promise<{
    clientId?: string;
    query?: string;
  }>;
}

async function AppQuestionsPage(props: Props) {
  const params = await props.searchParams;
  const clientsResponse = await getClients({ limit: 100, isActive: true, sort: 'name,asc' });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <QuestionsBrowser
        clients={clientsResponse.data.data}
        initialClientId={params.clientId}
        initialQuery={params.query}
      />
    </div>
  );
}

export default AppQuestionsPage;
