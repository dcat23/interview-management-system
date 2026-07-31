import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { DASHBOARD,  } from '@feature/base/server';
import ProcessesData from '@app/dashboard/components/process/processes-data';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{}>;
}

async function AppClientsIdPage(props: Props) {
  const {  id  } = await props.params;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title="Interview Processes"
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: 'Clients', href: '/clients' },
          { label: 'Clients', href: '/clients' },
        ]}
      />

      <ProcessesData />
    </div>
  );
}

export default AppClientsIdPage;
