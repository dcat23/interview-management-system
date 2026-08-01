import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { DASHBOARD, SESSIONS } from '@feature/base/lib/types/nav';

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppSessionsPage(props: Props) {
  const params = await props.params;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: SESSIONS.name, href: SESSIONS.href },
        ]}
      ></AppPageHeader>
    </div>
  );
}

export default AppSessionsPage;
