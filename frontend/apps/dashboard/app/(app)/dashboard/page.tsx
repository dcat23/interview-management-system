import { DASHBOARD } from "@feature/base/server";
import AppPageHeader from "@app/dashboard/components/app/app-page-header";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppDashboardPage(props: Props) {
  const params = await props.params;

  return (
    <>
      <AppPageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: DASHBOARD.name, href: DASHBOARD.href },
        ]}
      >
        {/* <div className="flex items-center gap-2">
            <Button variant="outline">
              <RiDownloadLine data-icon="inline-start" aria-hidden="true" />
              Export
            </Button>
            <Button>Save Changes</Button>
          </div> */}
      </AppPageHeader>
    </>
  );
}

export default AppDashboardPage;
