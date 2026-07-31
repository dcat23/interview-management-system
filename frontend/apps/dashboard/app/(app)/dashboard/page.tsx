import { AppSidebar } from "@app/dashboard/components/ui/app-sidebar"
import { ChartAreaInteractive } from "@app/dashboard/components/ui/chart-area-interactive"
import { DataTable } from "@app/dashboard/components/ui/data-table"
import { SectionCards } from "@app/dashboard/components/ui/section-cards"
import { SiteHeader } from "@app/dashboard/components/ui/site-header"
import { SidebarInset, SidebarProvider } from "@app/dashboard/components/ui/common/sidebar"


export default function AppDashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      {/* <DataTable data={{}} /> */}
    </div>
  )
}
