'use client';

import { useCommandStore } from '@app/dashboard/stores/command-store';
import { RiSearchLine } from '@remixicon/react';
import { ReactNode } from 'react';
import { KbdGroup, Kbd } from '../ui/common/kbd';

interface Props {
}

export function CommandButton(props: Props) {
  const open = useCommandStore(state => state.open);
  return (
    <button
      type="button"
      onClick={open}
      className="relative flex h-9 w-full max-w-sm items-center gap-2 border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
    >
      <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-left">Search projects, people...</span>
      <KbdGroup className="hidden sm:inline-flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </button>
  );
}

export default CommandButton;
