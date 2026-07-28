import CommandButton from '@app/dashboard/components/app/command-button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@app/dashboard/components/ui/common/sidebar';
import { ReactNode } from 'react';
import AppSidebar from '../../components/app/app-sidebar';
import NavContextProvider from '../../stores/nav-context';

interface Props {
  children: ReactNode;
}

async function AppLayout(props: Props) {
  return (
    <NavContextProvider>
      <SidebarProvider>

        <AppSidebar role={'supporter'} />

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />

            <CommandButton />

            <div className="ml-auto flex items-center gap-2">
              {/* Account menu */}
            </div>
          </header>

          {props.children}
          
          {/* Command listener */}
        </SidebarInset>
      </SidebarProvider>
    </NavContextProvider>
  )
}

export default AppLayout;
