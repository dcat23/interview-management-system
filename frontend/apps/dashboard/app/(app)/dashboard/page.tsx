import { DASHBOARD } from "@feature/base/server";
import PageHeaderBlock from "@app/dashboard/components/ui/page-header-block";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppDashboardPage(props: Props) {
  const params = await props.params;

  return (
    <>
      <PageHeaderBlock
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
      </PageHeaderBlock>
    </>
  );
}

export default AppDashboardPage;
