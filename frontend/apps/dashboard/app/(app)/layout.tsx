import CommandButton from '@app/dashboard/components/app/command-button';
import { Button } from '@app/dashboard/components/ui/common/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@app/dashboard/components/ui/common/sheet';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@app/dashboard/components/ui/common/sidebar';
import { RiNotification3Line } from '@remixicon/react';
import { ReactNode } from 'react';
import { toast } from 'sonner';
import AppSidebar from '../../components/app/app-sidebar';

interface Props {
  children: ReactNode;
}

async function AppLayout(props: Props) {
  return (
    <SidebarProvider>
      
      <AppSidebar role='supporter' />
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />

          <CommandButton />

          <div className="ml-auto flex items-center gap-2">
            

            {/* <AccountMenu
              trigger={
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <Avatar>
                    <AvatarImage
                      src="https://i.pravatar.cc/150?img=15"
                      alt="Avery Cole"
                      className="grayscale"
                    />
                    <AvatarFallback>AC</AvatarFallback>
                  </Avatar>
                </Button>
              }
            /> */}
          </div>
        </header>
        {props.children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout;
