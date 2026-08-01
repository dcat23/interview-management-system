'use client';

import * as React from 'react';
import { ExternalLink, FileSearch, MoreHorizontal } from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@app/dashboard/components/ui/common/context-menu';
import { cn } from '@app/dashboard/lib/ui/utils';
import {
  type Filter,
  type FilterFieldConfig,
  type FilterFieldsConfig,
  Filters,
} from './filters';

export type AuditLogItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  type?: string;
  status?: string;
  icon?: React.ReactNode;
};

const auditLogFilterFields: FilterFieldConfig<string>[] = [
  {
    key: 'actor',
    label: 'Actor',
    type: 'select',
    options: [],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [],
  },
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    defaultOperator: 'contains',
    placeholder: 'Search events',
  },
];

function uniqueOptions(
  items: AuditLogItem[],
  key: 'actor' | 'type' | 'status',
) {
  return Array.from(
    new Set(items.map((item) => item[key]).filter(Boolean) as string[]),
  )
    .sort()
    .map((value) => ({ value, label: value }));
}

function matchesFilter(item: AuditLogItem, filter: Filter<string>) {
  if (filter.operator === 'empty') return true;
  if (filter.operator === 'not_empty') return true;

  const expected = filter.values.filter(Boolean);
  if (expected.length === 0) return true;

  if (filter.field === 'search') {
    const haystack = [
      item.title,
      item.description,
      item.actor,
      item.type,
      item.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const needle = expected[0]?.toLowerCase() ?? '';

    return filter.operator === 'not_contains'
      ? !haystack.includes(needle)
      : haystack.includes(needle);
  }

  const value = String(item[filter.field as 'actor' | 'type' | 'status'] ?? '');

  if (filter.operator === 'is_not' || filter.operator === 'is_not_any_of') {
    return !expected.includes(value);
  }

  return expected.includes(value);
}

export function AuditLog({
  items,
  enableFilters = true,
  onOpenRecord,
  onReviewChange,
  className,
}: {
  items: AuditLogItem[];
  enableFilters?: boolean;
  onOpenRecord?: (item: AuditLogItem) => void;
  onReviewChange?: (item: AuditLogItem) => void;
  className?: string;
}) {
  const [filters, setFilters] = React.useState<Filter<string>[]>([]);

  const fields = React.useMemo<FilterFieldsConfig<string>>(
    () =>
      auditLogFilterFields.map((field) => {
        if (field.key === 'actor') {
          return { ...field, options: uniqueOptions(items, 'actor') };
        }
        if (field.key === 'type') {
          return { ...field, options: uniqueOptions(items, 'type') };
        }
        if (field.key === 'status') {
          return { ...field, options: uniqueOptions(items, 'status') };
        }
        return field;
      }),
    [items],
  );

  const visibleItems = React.useMemo(
    () =>
      items.filter((item) =>
        filters.every((filter) => matchesFilter(item, filter)),
      ),
    [filters, items],
  );

  return (
    <div className={cn('grid gap-3', className)}>
      {enableFilters ? (
        <Filters
          filters={filters}
          fields={fields}
          onChange={setFilters}
          size="sm"
          allowMultiple={false}
        />
      ) : null}

      <div className="rounded-md border bg-card">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, index) => (
            <ContextMenu key={item.id}>
              <ContextMenuTrigger asChild>
                <div className="relative flex gap-3 px-4 py-3">
                  {index < visibleItems.length - 1 ? (
                    <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" />
                  ) : null}
                  <div className="z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.timestamp}
                      </div>
                    </div>
                    {item.description ? (
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {item.actor ? (
                        <span className="font-medium">{item.actor}</span>
                      ) : null}
                      {item.type ? (
                        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                          {item.type}
                        </span>
                      ) : null}
                      {item.status ? (
                        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                          {item.status}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem onSelect={() => onOpenRecord?.(item)}>
                  <ExternalLink />
                  Open record
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onReviewChange?.(item)}>
                  <FileSearch />
                  Review change
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <MoreHorizontal />
                  Copy record ID
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No audit log items match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
