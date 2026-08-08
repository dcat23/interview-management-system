'use client';

import {
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiUser3Line,
} from '@remixicon/react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@feature/ui/components/ui/common/dropdown-menu';
import { ReactElement } from 'react';

interface Props {
  trigger: ReactElement;
}

export function AccountMenu({ trigger }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="flex flex-col px-2 py-1.5">
          <span className="text-xs font-medium text-foreground">
            Avery Cole
          </span>
          <span className="text-xs text-muted-foreground">avery@acme.com</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            toast('Account', { description: 'Opening your account.' })
          }
        >
          <RiUser3Line />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            toast('Settings', { description: 'Opening your settings.' })
          }
        >
          <RiSettings3Line />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() =>
            toast.success('Logged out', { description: 'See you soon.' })
          }
        >
          <RiLogoutBoxRLine />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountMenu;
