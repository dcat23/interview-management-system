import AppPageBreadcrumbs from "@app/dashboard/components/app/app-page-breadcrumbs";
import AppPageHeader from "@app/dashboard/components/app/app-page-header";
import ProcessesData from "@app/dashboard/components/process/processes-data";
import { DataTable } from "@app/dashboard/components/ui/data-table";
import { DASHBOARD, PROCESSES } from "@feature/base/lib/types/nav";


interface Props {
  params: Promise<{}>;
}

async function AppProcessesPage(props: Props) {
  const params = await props.params;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title="Interview Processes"
        breadcrumbs={[
          { label: "Home", href: DASHBOARD.href },
          { label: PROCESSES.name, href: PROCESSES.href },
        ]}
      />
      
      <ProcessesData />
    </div>
  );
}

export default AppProcessesPage;
