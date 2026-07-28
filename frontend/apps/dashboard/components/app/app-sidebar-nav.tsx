'use client';

import { useNav } from '@app/dashboard/stores/nav-context';
import { NavItem, getCurrentPage } from '@feature/base/server';
import { DynamicIcon } from 'lucide-react/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/common/sidebar';

interface Props {
  navigation: NavItem[];
}

export function AppSidebarNav({ navigation }: Props) {
  const pathname = usePathname();
  const currentPage = getCurrentPage(pathname, navigation);
  const { setNav } = useNav()

  return (
    <SidebarMenu>
      {navigation.map((item) => (
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={item === currentPage}
            tooltip={item.name}
          >
            <Link href={item.href} onClick={() => setNav(item)}>
              <DynamicIcon name={item.icon} />
              <span>{item.name}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default AppSidebarNav;
