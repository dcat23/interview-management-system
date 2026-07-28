import { COMMON_NAV, Role, ROLE_NAV } from '@feature/base/server';
import { ReactNode } from 'react';
import { PROJECT_NAME } from '../../lib/constants/metadata';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem } from '../ui/common/sidebar';
import AccountMenu from './account-menu';
import AppAccountMenuButton from './app-account-menu-button';
import AppSidebarNav from './app-sidebar-nav';

interface Props {
  role: Role;
  children?: ReactNode;
}

export function AppSidebar(props: Props) {
  const navigation = props.role ? ROLE_NAV[props.role] : COMMON_NAV;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="size-5 shrink-0 text-foreground"
          >
            <rect
              x="3"
              y="3"
              width="8"
              height="8"
              transform="rotate(-6 7 7)"
            />
            <rect
              x="3"
              y="13"
              width="8"
              height="8"
              transform="rotate(5 7 17)"
            />
            <rect
              x="13"
              y="13"
              width="8"
              height="8"
              transform="rotate(-4 17 17)"
            />
            <rect
              x="13"
              y="3"
              width="8"
              height="8"
              transform="rotate(15 17 7)"
            />
          </svg>
          <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
            {PROJECT_NAME}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <AppSidebarNav navigation={navigation} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AccountMenu
              trigger={
                <AppAccountMenuButton />
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
