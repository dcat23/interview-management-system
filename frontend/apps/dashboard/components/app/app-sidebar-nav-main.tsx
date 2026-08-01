import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@app/dashboard/components/ui/common/sidebar';
import { NavItem } from '@feature/base/server';
import { PlusCircleIcon, Upload } from 'lucide-react';
import { Button } from '../ui/common/button';
import AppSidebarNavMenu from './app-sidebar-nav-menu';
import { Tooltip } from '@app/dashboard/components/ui/common/tooltip';

export function AppSidebarNavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <PlusCircleIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Tooltip>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <Upload />
              </Button>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <AppSidebarNavMenu navigation={items} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
