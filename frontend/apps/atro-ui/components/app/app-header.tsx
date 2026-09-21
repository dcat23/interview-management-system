'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';

import { cn } from '@app/atro-ui/lib/ui/utils';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Avatar, AvatarFallback } from '@app/atro-ui/components/ui/common/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/atro-ui/components/ui/common/dropdown-menu';
import { signOutAction, ROLE_HOME, type Role } from '@feature/auth/server';
import { ROLE_NAV, getCurrentPage } from '@feature/base/server';
import { CommandMenu02 } from '@app/atro-ui/components/command-menu-02';

interface Props {
  email?: string | null;
  role: Role;
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// signOutAction is a <form action> handler whose redirect relies on a thrown
// error propagating through Next's form-action mechanism, so it can't be
// invoked as a bare async call from a menu item's click handler. This
// hidden-form + requestSubmit is the standard way to trigger a real form
// action from a non-form control (a DropdownMenuItem here).
function SignOutMenuItem() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <DropdownMenuItem
      className="text-destructive focus:text-destructive"
      onSelect={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} action={signOutAction} className="hidden" />
      <LogOut className="size-4" />
      Sign out
    </DropdownMenuItem>
  );
}

export function AppHeader({ email, role }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = ROLE_NAV[role];
  const homeHref = ROLE_HOME[role];
  const currentPage = getCurrentPage(pathname, navigation);
  const label = email ?? '';

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href={homeHref} className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 transition-colors group-hover:border-primary/50">
            <span className="font-mono text-xs font-semibold text-primary">A</span>
          </div>
          <span className="hidden text-lg font-semibold tracking-tight sm:inline-block">Atro</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const isActive = item === currentPage;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                <DynamicIcon name={item.icon} className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <CommandMenu02 role={role} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-10 rounded-full">
                <Avatar>
                  <AvatarFallback>{initials(label)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
                <span className="truncate font-medium">{email}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {role}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
            <Link
              href={homeHref}
              className="flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <span className="font-mono text-xs font-semibold text-primary">A</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">Atro</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col gap-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = item === currentPage;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <DynamicIcon name={item.icon} className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            <div className="mt-3 flex items-center gap-3 border-t border-border/50 px-3 pt-4">
              <Avatar>
                <AvatarFallback>{initials(label)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{email}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{role}</p>
              </div>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default AppHeader;
