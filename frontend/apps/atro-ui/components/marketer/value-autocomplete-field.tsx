'use client';

import { useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { fieldInputClass, fieldLabelClass } from '@app/atro-ui/components/supporter/settings-fields';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Distinguishes the React Query cache per lookup, e.g. 'session-modes'.
  lookupKey: string;
  lookup: (query: string) => Promise<string[]>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Free-text input with suggestions from a backend lookup. Unlike
 * UserLookupField the typed value is always accepted — suggestions only
 * steer toward existing spellings so the catalog doesn't fragment.
 */
export function ValueAutocompleteField({
  label,
  value,
  onChange,
  lookupKey,
  lookup,
  placeholder,
  required,
  disabled,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debouncedQuery = useDebouncedValue(value.trim(), 200);

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['value-lookup', lookupKey, debouncedQuery],
    queryFn: () => lookup(debouncedQuery),
    enabled: focused,
    // The backend serves these from a cached catalog; no need to refetch per focus.
    staleTime: 5 * 60 * 1000,
  });

  // Hide the list when the only suggestion is exactly what's typed.
  const visible = suggestions.filter((s) => s.toLowerCase() !== value.trim().toLowerCase());
  const open = focused && visible.length > 0;

  const select = (suggestion: string) => {
    onChange(suggestion);
    setHighlighted(-1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % visible.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? visible.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      select(visible[highlighted]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  return (
    <label className="block space-y-1.5">
      <span className={fieldLabelClass}>{label}</span>
      <div className="relative">
        <input
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHighlighted(-1);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className={fieldInputClass}
        />
        {focused && isFetching && (
          <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}

        {open && (
          <ul
            role="listbox"
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto border border-border bg-background shadow-md"
          >
            {visible.map((suggestion, index) => (
              <li key={suggestion} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  tabIndex={-1}
                  // mousedown fires before the input's blur, which would otherwise close the list first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(suggestion);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted',
                    index === highlighted && 'bg-muted',
                  )}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}

export default ValueAutocompleteField;
