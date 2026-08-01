import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { DASHBOARD } from '@feature/base/server';
import { getClientById } from '@feature/backend/server';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{}>;
}

async function AppClientsIdPage(props: Props) {
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title={client.name}
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: 'Clients', href: '/clients' },
          { label: client.name, href: '#' },
        ]}
      />
    </div>
  );
}

export default AppClientsIdPage;
