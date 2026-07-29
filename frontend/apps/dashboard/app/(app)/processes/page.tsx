import AppPageHeader from "@app/dashboard/components/app/app-page-header";
import ProcessesData from "@app/dashboard/components/process/processes-data";
import { DataTable } from "@app/dashboard/components/ui/data-table";
import { DASHBOARD, PROCESSES } from "@feature/base/lib/types/nav";

// Data is fetched client-side (React Query) by ProcessesData, keyed off the
// ?page/?limit URL params, so the table can paginate/refetch without a full
// server round trip.

interface Props {
  params: Promise<{}>;
}

async function AppProcessesPage(props: Props) {
  const params = await props.params;

  return (
    <main>
      <AppPageHeader
        breadcrumbs={[
          { label: "Home", href: DASHBOARD.href },
          { label: PROCESSES.name, href: PROCESSES.href },
        ]}
      />
      
      <ProcessesData />
    </main>
  );
}

export default AppProcessesPage;
