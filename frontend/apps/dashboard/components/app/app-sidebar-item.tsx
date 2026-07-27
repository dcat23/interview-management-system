'use client';

import { useNavStore } from '@app/dashboard/stores/nav-store';
import { NavItem } from '@feature/base/server';
import { DynamicIcon } from 'lucide-react/dynamic';
import { SidebarMenuButton, SidebarMenuItem } from '../ui/common/sidebar';
import { useRouter } from 'next/navigation';

interface Props {
  item: NavItem;
}

export function AppSidebarItem({ item }: Props) {
  const { activeNav, setNav} = useNavStore()
  const router = useRouter()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={activeNav?.name === item.name}
        tooltip={item.name}
        onClick={() => {
          setNav(item)
          router.push(item.href)
        }}
      >
        <DynamicIcon name={item.icon} />
        <span>{item.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppSidebarItem;
