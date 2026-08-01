import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@feature/ui/components/ui/common/sidebar';
import { DASHBOARD_NAV } from '@app/dashboard/lib/constants/navigation';
import { auth, User } from '@feature/auth/server';
import { capitalize, Role, SECONDARY_NAV } from '@feature/base/server';
import { CommandIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import { AppSidebarNavMain } from './app-sidebar-nav-main';
import { AppSidebarNavSecondary } from './app-sidebar-nav-secondary';
import { AppSidebarNavUser } from './app-sidebar-nav-user';

interface Props extends React.ComponentProps<typeof Sidebar> {
  role?: Role;
  children?: ReactNode;
}

export async function AppSidebar({ role, ...props }: Props) {
  const session = await auth();
  const user = session?.user ?? ({} as User);

  const navMain = DASHBOARD_NAV[user.role] || [];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">
                  {capitalize(user.role)} Portal
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Main nav */}
        <AppSidebarNavMain items={navMain} />
        {/* <AppSidebarNavDocuments items={data.documents} /> */}
        <AppSidebarNavSecondary items={SECONDARY_NAV} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <AppSidebarNavUser
          user={{
            name: user.name as string,
            email: user.email as string,
            image: user.image as string,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
