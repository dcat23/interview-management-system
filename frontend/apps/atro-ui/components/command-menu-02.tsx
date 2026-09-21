'use client';

import {
  IconFileSpreadsheet,
  IconLogout,
  IconMoon,
  IconSearch,
  IconSun,
} from '@tabler/icons-react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@app/atro-ui/components/ui/common/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@app/atro-ui/components/ui/common/dialog';
import { Kbd, KbdGroup } from '@app/atro-ui/components/ui/common/kbd';
import { ScheduleImportDrawer } from '@app/atro-ui/components/schedule-import-drawer';
import { signOutAction, type Role } from '@feature/auth/server';
import { ROLE_NAV } from '@feature/base/server';

/** Roles that manage interview logistics and can bulk-import a schedule. */
const IMPORT_SCHEDULE_ROLES: Role[] = ['supporter', 'admin'];

interface Props {
  role: Role;
}

export function CommandMenu02({ role }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const signOutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigation = ROLE_NAV[role];
  const canImportSchedule = IMPORT_SCHEDULE_ROLES.includes(role);

  const runAndClose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <Button
        aria-label="Open command menu"
        className="gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <IconSearch aria-hidden className="size-4" />
        <span className="hidden sm:inline">Search...</span>
        <KbdGroup className="hidden sm:inline-flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogHeader className="sr-only">
          <DialogTitle>Command Menu</DialogTitle>
          <DialogDescription>
            Search for pages and run quick actions.
          </DialogDescription>
        </DialogHeader>
        <DialogContent
          className="gap-0 overflow-hidden rounded-xl border-border/50 p-0 shadow-lg sm:max-w-lg"
          showCloseButton={false}
        >
          <Command className="p-0 **:data-[slot=input-group]:h-10! **:data-[slot=command-input-wrapper]:grow **:data-[slot=input-group]:rounded-none! **:data-[slot=input-group]:border-0 **:data-[slot=input-group]:bg-transparent **:data-[slot=command-input-wrapper]:p-0 **:data-[slot=input-group-addon]:pl-0!">
            <div className="flex h-12 items-center gap-2 border-border/50 border-b px-4">
              <CommandInput
                className="text-[15px]"
                onValueChange={setInputValue}
                placeholder="What do you need?"
                value={inputValue}
              />
              <button
                className="flex shrink-0 items-center"
                onClick={() => setOpen(false)}
                type="button"
              >
                <Kbd>Esc</Kbd>
              </button>
            </div>

            <CommandList className="max-h-[400px] py-2">
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup heading="Go to">
                {navigation.map((item) => (
                  <CommandItem
                    className="mx-2 rounded-lg py-2.5"
                    key={item.href}
                    onSelect={() => runAndClose(() => router.push(item.href))}
                  >
                    <DynamicIcon aria-hidden className="size-4" name={item.icon} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>

              {canImportSchedule && (
                <CommandGroup heading="Quick Actions">
                  <CommandItem
                    className="mx-2 rounded-lg py-2.5"
                    onSelect={() => runAndClose(() => setImportOpen(true))}
                  >
                    <IconFileSpreadsheet aria-hidden />
                    Import Schedule...
                  </CommandItem>
                </CommandGroup>
              )}

              <CommandGroup heading="Account">
                <CommandItem
                  className="mx-2 rounded-lg py-2.5"
                  onSelect={() =>
                    runAndClose(() =>
                      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
                    )
                  }
                >
                  {resolvedTheme === 'dark' ? (
                    <IconSun aria-hidden />
                  ) : (
                    <IconMoon aria-hidden />
                  )}
                  {resolvedTheme === 'dark'
                    ? 'Switch to Light Mode'
                    : 'Switch to Dark Mode'}
                </CommandItem>
                <CommandItem
                  className="mx-2 rounded-lg py-2.5"
                  onSelect={() =>
                    runAndClose(() => signOutFormRef.current?.requestSubmit())
                  }
                >
                  <form
                    action={signOutAction}
                    className="hidden"
                    ref={signOutFormRef}
                  />
                  <IconLogout aria-hidden />
                  Sign Out
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <ScheduleImportDrawer onOpenChange={setImportOpen} open={importOpen} />
    </>
  );
}

export default CommandMenu02;
