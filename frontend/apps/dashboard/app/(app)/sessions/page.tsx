import AppPageHeader from "@app/dashboard/components/app/app-page-header";
import { DASHBOARD, SESSIONS } from "@feature/base/lib/types/nav";

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppSessionsPage(props: Props) {
  const params = await props.params;

  return (
    <>
      <AppPageHeader
        breadcrumbs={[
          { label: "Home", href: DASHBOARD.href },
          { label: SESSIONS.name, href: SESSIONS.href },
        ]}
      >
      </AppPageHeader>
    </>
  );
}

export default AppSessionsPage;
