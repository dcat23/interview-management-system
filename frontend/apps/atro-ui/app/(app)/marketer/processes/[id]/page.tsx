import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { getProcessById } from '@feature/backend/server';
import { MarketerProcessView } from '@app/atro-ui/components/marketer/marketer-process-view';

interface Props {
  params: Promise<{ id: string }>;
}

async function AppMarketerProcessesIdPage(props: Props) {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  const { id } = await props.params;
  const response = await getProcessById(id);

  if (response.error) {
    throw response.error;
  }

  if (!response.success) {
    throw new Error(response.message);
  }

  return <MarketerProcessView process={response.data} />;
}

export default AppMarketerProcessesIdPage;
