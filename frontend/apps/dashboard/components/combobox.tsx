'use client';

import { useMemo } from 'react';
import { ChevronsUpDownIcon, SearchIcon, XIcon } from 'lucide-react';

import { cn } from '@feature/ui/lib/ui/utils';
import { Button } from '@feature/ui/components/ui/common/button';
import {
  Combobox as ComboboxPrimitive,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '@feature/ui/components/ui/common/combobox';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  options: ComboboxOption[];
  value: string | undefined;
  onSelect: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
}: Props) {
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <div className={cn('flex gap-1', className)}>
      <ComboboxPrimitive
        items={options}
        value={selected}
        onValueChange={(next) => onSelect((next as ComboboxOption | null)?.value)}
      >
        <ComboboxTrigger
          render={
            <Button
              className="h-9 flex-1 justify-between font-normal"
              variant="outline"
            />
          }
        >
          <ComboboxValue placeholder={placeholder} />
          <ChevronsUpDownIcon className="-me-1!" />
        </ComboboxTrigger>
        <ComboboxPopup aria-label={placeholder}>
          <div className="border-b p-2">
            <ComboboxInput
              className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
              placeholder={searchPlaceholder}
              showTrigger={false}
              startAddon={<SearchIcon />}
            />
          </div>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(option: ComboboxOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPrimitive>
      {value && (
        <Button
          aria-label={`Clear ${placeholder}`}
          className="h-9"
          onClick={() => onSelect(undefined)}
          size="icon"
          variant="ghost"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

export default Combobox;
