import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { getProcessById } from '@feature/backend/server';
import { ProcessResume } from '@app/atro-ui/components/supporter/process-resume';

interface Props {
  params: Promise<{ id: string }>;
}

async function AppSupporterProcessesIdPage(props: Props) {
  const session = await auth();

  if (session?.user?.role !== 'supporter') {
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

  return <ProcessResume process={response.data} />;
}

export default AppSupporterProcessesIdPage;
