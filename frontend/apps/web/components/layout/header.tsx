'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useRef, useState } from 'react';
import { cn } from '@feature/ui/lib/utils';
import { Button } from '@feature/ui/components/button';
import { Avatar, AvatarFallback } from '@feature/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@feature/ui/components/dropdown-menu';
import { ThemeToggle } from '@app/web/components/theme-toggle';
import { useTheme } from '@app/web/lib/providers/theme-provider';
import { signOutAction, ROLE_HOME, type Role } from '@feature/auth/server';
import { ROLE_NAV, getCurrentPage } from '@feature/base/server';

interface Props {
  email?: string | null;
  role?: Role | null;
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// signOutAction is typed as a <form action> handler — its redirect relies on
// a thrown error propagating through Next's form-action mechanism, so it
// can't be invoked as a bare async call from a menu item's click handler.
// This hidden-form + requestSubmit is the standard way to trigger a real
// form action from a non-form control (a Radix DropdownMenuItem here).
function SignOutMenuItem() {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <DropdownMenuItem
      className="text-destructive-foreground cursor-pointer"
      onSelect={() => formRef.current?.requestSubmit()}
    >
      <form ref={formRef} action={signOutAction} className="hidden" />
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </DropdownMenuItem>
  );
}

export function Header(props: Props) {
  const { email, role } = props;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const navigation = role ? ROLE_NAV[role] : [];
  const homeHref = role ? ROLE_HOME[role] : '/';
  const currentPage = getCurrentPage(pathname, navigation);
  const label = email ?? '';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href={homeHref} className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 group-hover:border-primary/50 transition-colors">
                <span className="font-mono text-sm font-semibold text-primary">IMS</span>
              </div>
              <span className="hidden font-semibold text-lg tracking-tight sm:inline-block">Interview Portal</span>
            </Link>

            {currentPage && (
              <div className="flex items-center gap-2 md:hidden">
                <span className="text-muted-foreground/50">/</span>
                <div className="flex items-center gap-1.5 text-foreground">
                  <DynamicIcon name={currentPage.icon} className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{currentPage.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = item === currentPage;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                  )}
                >
                  <DynamicIcon name={item.icon} className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase tracking-wider">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full ring-1 ring-border hover:ring-primary/50 transition-all"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-mono text-sm">
                      {initials(label)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <div className="flex flex-col">
                    <p className="font-semibold truncate">{email}</p>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{role}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <SignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-primary/10"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-background md:hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex h-full flex-col">
            {/* Mobile Menu Header */}
            <div className="flex h-14 items-center justify-between border-b border-border/50 px-4">
              <Link
                href={homeHref}
                className="flex items-center gap-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                  <span className="font-mono text-xs font-semibold text-primary">IMS</span>
                </div>
                <span className="font-semibold tracking-tight">Interview Portal</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="hover:bg-primary/10 h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 flex flex-col justify-between px-4 py-4">
              {/* Main Navigation */}
              <nav className="space-y-1">
                {navigation.map((item, index) => {
                  const isActive = item === currentPage;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200 animate-slide-in-right',
                        `stagger-${index + 1}`,
                        isActive
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                      )}
                    >
                      <DynamicIcon name={item.icon} className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User section */}
              <div className="animate-fade-up stagger-6">
                <div className="h-px bg-border/50 my-3" />

                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <Avatar className="h-10 w-10 ring-1 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-mono text-sm">
                      {initials(label)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{email}</p>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">{role}</p>
                  </div>
                  <button
                    onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center justify-center h-9 w-9 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    aria-label="Toggle theme"
                  >
                    {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </button>
                </div>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive-foreground bg-destructive/5 hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
