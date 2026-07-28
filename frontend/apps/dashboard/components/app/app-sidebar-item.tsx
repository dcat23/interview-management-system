'use client';

import { useNav } from '@app/dashboard/stores/nav-context';
import { NavItem } from '@feature/base/server';
import { DynamicIcon } from 'lucide-react/dynamic';
import Link from 'next/link';
import { SidebarMenuButton, SidebarMenuItem } from '../ui/common/sidebar';

interface Props {
  item: NavItem;
  isActive: boolean;
}

export function AppSidebarItem({ item, isActive }: Props) {
  const { setNav } = useNav()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.name}
      >
        <Link href={item.href} onClick={() => setNav(item)}>
          <DynamicIcon name={item.icon} />
          <span>{item.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppSidebarItem;
