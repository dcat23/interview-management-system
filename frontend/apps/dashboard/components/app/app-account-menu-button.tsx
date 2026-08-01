'use client';

import { Avatar, AvatarFallback, AvatarImage } from '../ui/common/avatar';
import { SidebarMenuButton } from '../ui/common/sidebar';

interface Props {
  name?: string;
  email?: string;
  image?: string;
}

function initials(name: string): string {
  const parts = name.split(' ');
  const first = (parts[0] ?? '').charAt(0).toUpperCase();
  const last = (parts[-1] ?? '').charAt(0).toUpperCase();
  return first + last;
}

export function AppAccountMenuButton({
  name = 'Avery Cole',
  email = 'avery@acme.com',
  image = 'https://i.pravatar.cc/150?img=15',
}: Props) {
  return (
    <SidebarMenuButton
      size="lg"
      tooltip="Account"
      className="gap-2 group-data-[collapsible=icon]:justify-center"
    >
      <Avatar size="sm">
        <AvatarImage src={image} alt={name} className="grayscale" />
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="truncate text-xs font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </span>
    </SidebarMenuButton>
  );
}

export default AppAccountMenuButton;
