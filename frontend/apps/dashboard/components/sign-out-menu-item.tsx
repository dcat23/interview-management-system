'use client';

import { ReactNode, useRef } from 'react';
import { DropdownMenuItem } from '@feature/ui/components/ui/common/dropdown-menu';
import { signOutAction } from '@feature/auth/server';
import { LogOut } from 'lucide-react';
import { SignOutIcon } from '@phosphor-icons/react';

interface Props {
  data?: unknown;
  children?: ReactNode;
}

export function SignOutMenuItem(props: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <DropdownMenuItem
      className="text-destructive-foreground cursor-pointer"
      onSelect={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} action={signOutAction} className="hidden" />
      <SignOutIcon />
      Log out
    </DropdownMenuItem>
  );
}

export default SignOutMenuItem;
