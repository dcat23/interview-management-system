'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';

import { getUsers } from '@feature/backend/server';
import { USER_ROLES, type User, type UserRole } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { Avatar, AvatarFallback } from '@app/atro-ui/components/ui/common/avatar';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { Skeleton } from '@app/atro-ui/components/ui/common/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/atro-ui/components/ui/common/table';
import { formatDate } from '@app/atro-ui/components/supporter/settings-fields';
import { ROLE_LABEL, UserRoleBadge } from './user-role-badge';
import { UserFormDialog } from './user-form-dialog';

const PAGE_LIMIT = 20;
const SKELETON_ROWS = 6;

type StatusFilter = 'active' | 'inactive';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface FilterChipProps {
  pressed: boolean;
  onClick: () => void;
  label: string;
}

function FilterChip({ pressed, onClick, label }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        'h-8 rounded-lg border px-3 text-xs font-medium transition-colors',
        pressed
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

interface Props {
  currentUserEmail: string | null | undefined;
}

export function UsersTable({ currentUserEmail }: Props) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [page, setPage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['admin-users', role, status, page],
    queryFn: async () => {
      const response = await getUsers({
        role: role ?? undefined,
        isActive: status === 'active',
        page,
        limit: PAGE_LIMIT,
      });
      if (!response.success) {
        toast.error(response.message ?? 'Failed to load users');
      }
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const isSelf = (user: User) => !!currentUserEmail && user.email === currentUserEmail;

  const changeRole = (next: UserRole | null) => {
    setRole(next);
    setPage(0);
  };

  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(0);
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };

  const onSaved = (saved: User) => {
    toast.success(editing ? `${saved.name} updated` : `${saved.name} added`);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-muted-foreground">
            Add accounts, change roles, and deactivate users who no longer need access.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Add user
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip pressed={role === null} onClick={() => changeRole(null)} label="All roles" />
        {USER_ROLES.map((r) => (
          <FilterChip key={r} pressed={role === r} onClick={() => changeRole(r)} label={ROLE_LABEL[r]} />
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <FilterChip pressed={status === 'active'} onClick={() => changeStatus('active')} label="Active" />
        <FilterChip
          pressed={status === 'inactive'}
          onClick={() => changeStatus('inactive')}
          label="Inactive"
        />
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
          {isFetching && !isLoading ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
          {total} {total === 1 ? 'user' : 'users'}
        </span>
      </div>

      <Table className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">Manage</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-7 w-16" />
                </TableCell>
              </TableRow>
            ))
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No {status} {role ? ROLE_LABEL[role].toLowerCase() + 's' : 'users'} found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {user.name}
                        {isSelf(user) ? (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(user.updatedAt ?? user.createdAt)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <UserRoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'soft' : 'secondary'}>
                    {user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pageCount > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            Page {page + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page + 1 >= pageCount || isPlaceholderData}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      ) : null}

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editing}
        isSelf={!!editing && isSelf(editing)}
        onSaved={onSaved}
      />
    </section>
  );
}

export default UsersTable;
