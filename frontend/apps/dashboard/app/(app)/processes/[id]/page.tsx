import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { DASHBOARD, PROCESSES } from '@feature/base/server';
import { getProcessById } from '@feature/backend/server';
import {ProcessSessionsLog} from "@app/dashboard/components/process/process-sessions-log";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{}>;
}

async function AppProcessesIdPage(props: Props) {
  const { id } = await props.params;
  const response = await getProcessById(id);

  if (response.error) {
    throw response.error;
  }

  if (!response.success) {
    throw new Error(response.message)
  }

  const process = response.data;
  const breadcrumbLabel = process.clientName ?? "Process"
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title={`${process.clientName} - ${process.candidateName}`}
        badge={process.status}
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: PROCESSES.name, href: PROCESSES.href },
          { label: breadcrumbLabel, href: '#' },
        ]}
      >
        {/* add session button */}
      </AppPageHeader>

      <ProcessSessionsLog
        className={'px-4 lg:px-6'}
        sessions={process.sessions ?? []}
      />
      {/* separator */}
      {/* */}
    </div>
  );
}

export default AppProcessesIdPage;
