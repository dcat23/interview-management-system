import AppHeader from '@app/dashboard/components/app/app-header';
import { AppSidebar } from '@app/dashboard/components/app/sidebar/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@feature/ui/components/ui/common/sidebar';
import NavContextProvider from '@app/dashboard/stores/nav-context';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

async function AppLayout(props: Props) {
  return (
    <NavContextProvider>
      <SidebarProvider
        defaultOpen
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />

        <SidebarInset>
          <AppHeader />

          <main className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              {props.children}
            </div>
          </main>

          {/* Command listener */}
        </SidebarInset>
      </SidebarProvider>
    </NavContextProvider>
  );
}

export default AppLayout;
