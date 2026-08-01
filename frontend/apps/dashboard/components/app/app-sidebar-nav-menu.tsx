import { NavItem } from '@feature/base/server';
import { DynamicIcon } from 'lucide-react/dynamic';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/common/sidebar';

interface Props {
  navigation: NavItem[];
}

export function AppSidebarNavMenu({ navigation }: Props) {
  return (
    <SidebarMenu>
      {navigation.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton asChild tooltip={item.name}>
            <Link href={item.href}>
              <DynamicIcon name={item.icon} />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default AppSidebarNavMenu;
