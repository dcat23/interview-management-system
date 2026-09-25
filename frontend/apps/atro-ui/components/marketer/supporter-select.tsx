'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from 'lucide-react';
import { lookupUsers, updateSession } from '@feature/backend/server';
import type { InterviewSession } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@app/atro-ui/components/ui/common/command';
import { Popover, PopoverContent, PopoverTrigger } from '@app/atro-ui/components/ui/common/popover';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';

interface Props {
  session: InterviewSession;
  onUpdated?: (session: InterviewSession) => void;
}

/**
 * Supporter picker that reassigns the session on select (PATCH /sessions/:id).
 * Lists supporters on open — an empty /users/lookup query matches everyone,
 * capped at 20 — and narrows by name as you type.
 */
export function SupporterSelect({ session, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const debouncedQuery = useDebouncedValue(query.trim(), 200);

  const { data: supporters = [], isFetching } = useQuery({
    queryKey: ['user-lookup', 'SUPPORTER', debouncedQuery],
    queryFn: async () => {
      const { data } = await lookupUsers({ query: debouncedQuery, role: 'SUPPORTER' });
      return data ?? [];
    },
    enabled: open,
    staleTime: 60 * 1000,
  });

  const assign = async (supporterId: string) => {
    setOpen(false);
    if (supporterId === session.supporterId) return;

    setSaving(true);
    const result = await updateSession(session.id, { supporterId });
    setSaving(false);

    if (!result.success || !result.data) {
      toast.error(result.message ?? 'Could not reassign the supporter. Try again.');
      return;
    }

    toast.success(`Assigned to ${result.data.supporterName ?? 'supporter'}`);
    void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    onUpdated?.(result.data);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Assign supporter"
          disabled={saving}
          className="-mr-2 h-7 max-w-44 gap-1 px-2 font-medium"
        >
          <span className="truncate">{session.supporterName ?? 'Unassigned'}</span>
          {saving ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-0">
        {/* Server-side search, so cmdk's own filtering is off. */}
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search supporters…" />
          <CommandList>
            {isFetching && supporters.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>No supporters found.</CommandEmpty>
            )}
            <CommandGroup>
              {supporters.map((supporter) => (
                <CommandItem key={supporter.id} value={supporter.id} onSelect={() => void assign(supporter.id)}>
                  <span className="truncate">{supporter.name}</span>
                  {supporter.id === session.supporterId && <CheckIcon className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SupporterSelect;
