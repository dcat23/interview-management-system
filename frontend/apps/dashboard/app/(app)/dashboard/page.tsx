import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { ChartAreaInteractive } from '@app/dashboard/components/ui/chart-area-interactive';
import { SectionCards } from '@app/dashboard/components/ui/section-cards';

export default function AppDashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        breadcrumbs={[
          {
            label: 'Home',
            href: '/dashboard',
          },
        ]}
      />
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      {/* <DataTable data={{}} /> */}
    </div>
  );
}
