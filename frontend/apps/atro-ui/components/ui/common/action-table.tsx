'use client';

import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Page } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/atro-ui/components/ui/common/dialog';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/atro-ui/components/ui/common/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@app/atro-ui/components/ui/common/tooltip';

export type ActionTableColumn<TData> = {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  className?: string;
  width?: string;
};

export type ActionTableAction<TData> = {
  id: string;
  label: string;
  icon: ReactNode;
  /** Awaited — the button shows a spinner and the row's other actions lock until it settles. */
  onClick: (row: TData) => void | Promise<void>;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
  disabled?: boolean;
  /** When set, the action runs only after confirming in a dialog. */
  confirm?: {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
  };
};

interface Props<TData> {
  columns: ActionTableColumn<TData>[];
  data?: TData[];
  getRowId: (row: TData) => string;
  rowActions?: (row: TData) => ActionTableAction<TData>[];
  actionsHeader?: ReactNode;
  emptyMessage?: ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  /** Backend `Page<TData>`; supplies rows and enables prev/next paging (0-indexed). */
  pageResponse?: Page<TData>;
  onPageChange?: (page: number) => void;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<ActionTableAction<unknown>['tone']>, string> = {
  default: '',
  success:
    'text-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-500',
  warning:
    'text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400 dark:hover:bg-amber-500',
  destructive: 'text-destructive hover:bg-destructive hover:text-white',
};

type Pending = { rowId: string; actionId: string };
type Confirming<TData> = { row: TData; rowId: string; action: ActionTableAction<TData> };

export function ActionTable<TData>({
  columns,
  data,
  getRowId,
  rowActions,
  actionsHeader = 'Actions',
  emptyMessage = 'No results.',
  isLoading = false,
  skeletonRows = 5,
  pageResponse,
  onPageChange,
  className,
}: Props<TData>) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirming, setConfirming] = useState<Confirming<TData> | null>(null);

  const rows = pageResponse?.data ?? data ?? [];
  const columnCount = columns.length + (rowActions ? 1 : 0);

  const run = async (row: TData, rowId: string, action: ActionTableAction<TData>) => {
    setPending({ rowId, actionId: action.id });
    try {
      await action.onClick(row);
    } finally {
      setPending(null);
    }
  };

  const trigger = (row: TData, rowId: string, action: ActionTableAction<TData>) => {
    if (action.confirm) setConfirming({ row, rowId, action });
    else void run(row, rowId, action);
  };

  const onConfirm = async () => {
    if (!confirming) return;
    await run(confirming.row, confirming.rowId, confirming.action);
    setConfirming(null);
  };

  const confirmPending =
    confirming !== null &&
    pending?.rowId === confirming.rowId &&
    pending.actionId === confirming.action.id;

  const totalPages = pageResponse ? Math.max(1, Math.ceil(pageResponse.total / Math.max(1, pageResponse.limit))) : 1;

  return (
    <TooltipProvider>
      <div className={cn('rounded-lg border bg-card', className)}>
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn('h-12 px-4 font-medium', column.className)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="h-12 w-[1%] px-4 font-medium">{actionsHeader}</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }, (_, cell) => (
                    <TableCell key={cell} className="h-16 px-4">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="h-24 px-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const rowId = getRowId(row);
                const busy = pending?.rowId === rowId;

                return (
                  <TableRow key={rowId} className="hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn('h-16 px-4', column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}

                    {rowActions && (
                      <TableCell className="h-16 px-4">
                        <div className="flex items-center gap-1">
                          {rowActions(row).map((action) => {
                            const actionPending = busy && pending?.actionId === action.id;
                            return (
                              <Tooltip key={action.id}>
                                <TooltipTrigger asChild>
                                  <Button
                                    aria-label={action.label}
                                    className={cn('h-8 w-8', TONE_CLASS[action.tone ?? 'default'])}
                                    disabled={busy || action.disabled}
                                    onClick={() => trigger(row, rowId, action)}
                                    size="icon"
                                    variant="outline"
                                  >
                                    {actionPending ? <Loader2 className="size-4 animate-spin" /> : action.icon}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{action.label}</TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {pageResponse && totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 border-t px-4 py-2 text-sm text-muted-foreground">
            <span>
              Page {pageResponse.page + 1} of {totalPages} &middot; {pageResponse.total} total
            </span>
            <div className="flex gap-1">
              <Button
                aria-label="Previous page"
                className="h-8 w-8"
                disabled={pageResponse.page <= 0}
                onClick={() => onPageChange?.(pageResponse.page - 1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                aria-label="Next page"
                className="h-8 w-8"
                disabled={pageResponse.page + 1 >= totalPages}
                onClick={() => onPageChange?.(pageResponse.page + 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && !confirmPending && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirming?.action.confirm?.title}</DialogTitle>
            {confirming?.action.confirm?.description && (
              <DialogDescription>{confirming.action.confirm.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={confirmPending}>
              Cancel
            </Button>
            <Button
              variant={confirming?.action.tone === 'destructive' ? 'destructive' : 'default'}
              onClick={() => void onConfirm()}
              disabled={confirmPending}
            >
              {confirmPending && <Loader2 className="animate-spin" aria-hidden />}
              {confirming?.action.confirm?.confirmLabel ?? confirming?.action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default ActionTable;
