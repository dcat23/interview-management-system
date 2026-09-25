'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2Icon, XIcon } from 'lucide-react';
import { lookupUsers } from '@feature/backend/server';
import type { UserLookup, UserRole } from '@feature/base/server';
import { fieldInputClass, fieldLabelClass } from '@app/atro-ui/components/supporter/settings-fields';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';

const MIN_QUERY_LENGTH = 2;

interface Props {
  label: string;
  role: UserRole;
  value: UserLookup | null;
  onChange: (user: UserLookup | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Name search over GET /users/lookup — the admin-only GET /users isn't
 * available to marketers, so candidate/supporter pickers go through this.
 */
export function UserLookupField({ label, role, value, onChange, placeholder, disabled }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const enabled = !value && debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['user-lookup', role, debouncedQuery],
    queryFn: async () => {
      const { data } = await lookupUsers({ query: debouncedQuery, role });
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });

  if (value) {
    return (
      <div className="space-y-1.5">
        <span className={fieldLabelClass}>{label}</span>
        <div className="flex h-11 items-center justify-between gap-2 border border-border bg-background px-3 text-sm">
          <span className="truncate font-medium text-foreground">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className={fieldLabelClass}>{label}</span>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder ?? 'Search by name…'}
            disabled={disabled}
            className={fieldInputClass}
          />
          {isFetching && (
            <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </label>

      {enabled && !isFetching && (
        <ul className="max-h-48 overflow-y-auto border border-border bg-background">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No matches.</li>
          ) : (
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(user);
                    setQuery('');
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  {user.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default UserLookupField;
