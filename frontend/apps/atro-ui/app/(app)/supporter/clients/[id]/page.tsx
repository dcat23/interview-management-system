import { redirect } from 'next/navigation';
import moment from 'moment';
import { auth } from '@feature/auth/server';
import { getClientById } from '@feature/backend/server';
import { ClientActiveProcesses } from '@app/atro-ui/components/supporter/client-active-processes';

interface Props {
  params: Promise<{ id: string }>;
}

async function AppSupporterClientsIdPage(props: Props) {
  const session = await auth();

  if (session?.user?.role !== 'supporter') {
    redirect('/login');
  }

  const { id } = await props.params;
  const response = await getClientById(id);

  if (response.error) {
    throw response.error;
  }

  if (!response.success) {
    throw new Error(response.message);
  }

  const client = response.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {client.industry ? `${client.industry} · ` : ''}
          {client.active ? 'Active client' : 'Inactive client'} since{' '}
          {moment(client.createdAt).format('MMM YYYY')}
        </p>
      </div>

      <ClientActiveProcesses clientId={client.id} />
    </div>
  );
}

export default AppSupporterClientsIdPage;
