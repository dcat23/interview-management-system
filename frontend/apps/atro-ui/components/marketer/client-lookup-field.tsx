'use client';

import { useState, type KeyboardEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import { createClient, getClients } from '@feature/backend/server';
import type { Client } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { fieldInputClass, fieldLabelClass } from '@app/atro-ui/components/supporter/settings-fields';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';

interface Props {
  value: Client | null;
  onChange: (client: Client | null) => void;
  disabled?: boolean;
}

/**
 * Client search with inline create — typing a name no existing client
 * matches offers "Create client", which POSTs /clients and selects the result.
 */
export function ClientLookupField({ value, onChange, disabled }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const { data: clients = [], isFetching } = useQuery({
    queryKey: ['clients', 'lookup', debouncedQuery],
    queryFn: async () => {
      const { data } = await getClients({
        page: 0,
        limit: 10,
        isActive: true,
        search: debouncedQuery || undefined,
        sort: 'name,asc',
      });
      return data?.data ?? [];
    },
    enabled: focused && !value,
    staleTime: 60 * 1000,
  });

  const trimmed = query.trim();
  // Offer create only once results for the current text are in, and none is
  // an exact (case-insensitive) match — partial matches stay listed above it
  // so near-duplicates like "Acme" vs "Acme Corp" are visible before creating.
  const settled = debouncedQuery === trimmed && !isFetching;
  const canCreate =
    settled && trimmed !== '' && !clients.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  const optionCount = clients.length + (canCreate ? 1 : 0);
  const open = focused && !creating && optionCount > 0;

  const select = (client: Client) => {
    onChange(client);
    setQuery('');
    setHighlighted(-1);
    setError(null);
  };

  const create = async () => {
    setCreating(true);
    setError(null);
    const result = await createClient({ name: trimmed });
    setCreating(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Could not create the client. Try again.');
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['clients'] });
    select(result.data);
  };

  const activate = (index: number) => {
    if (index < clients.length) select(clients[index]);
    else if (canCreate) void create();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || optionCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      activate(highlighted);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  if (value) {
    return (
      <div className="space-y-1.5">
        <span className={fieldLabelClass}>Client</span>
        <div className="flex h-11 items-center justify-between gap-2 border border-border bg-background px-3 text-sm">
          <span className="truncate font-medium text-foreground">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Clear client"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  const optionClass = (index: number) =>
    cn(
      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted',
      index === highlighted && 'bg-muted',
    );

  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className={fieldLabelClass}>Client</span>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(-1);
              setError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder="Search or create a client…"
            disabled={disabled || creating}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className={fieldInputClass}
          />
          {(isFetching || creating) && focused && (
            <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {open && (
            <ul
              role="listbox"
              className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto border border-border bg-background shadow-md"
            >
              {clients.map((client, index) => (
                <li key={client.id} role="option" aria-selected={index === highlighted}>
                  <button
                    type="button"
                    tabIndex={-1}
                    // mousedown fires before the input's blur, which would otherwise close the list first.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(client);
                    }}
                    className={optionClass(index)}
                  >
                    <span className="truncate">{client.name}</span>
                    {client.industry && (
                      <span className="ml-auto truncate text-xs text-muted-foreground">{client.industry}</span>
                    )}
                  </button>
                </li>
              ))}

              {canCreate && (
                <li role="option" aria-selected={highlighted === clients.length}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void create();
                    }}
                    className={cn(optionClass(clients.length), clients.length > 0 && 'border-t border-border')}
                  >
                    <PlusIcon className="size-4 text-muted-foreground" />
                    <span className="truncate">
                      Create client <span className="font-medium">&ldquo;{trimmed}&rdquo;</span>
                    </span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </label>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default ClientLookupField;
