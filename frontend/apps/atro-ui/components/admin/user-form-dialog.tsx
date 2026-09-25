'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

import { createUser, updateUser, type UpdateUserRequest } from '@feature/backend/server';
import { USER_ROLES, type User, type UserRole } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/atro-ui/components/ui/common/dialog';
import { fieldInputClass, fieldLabelClass } from '@app/atro-ui/components/supporter/settings-fields';
import { ROLE_LABEL } from './user-role-badge';

const MIN_PASSWORD_LENGTH = 12;

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'CANDIDATE',
  active: true,
};

function toForm(user: User | null): FormState {
  if (!user) return EMPTY_FORM;
  return { name: user.name, email: user.email, password: '', role: user.role, active: user.active };
}

// PATCH is partial — send only what changed so an untouched email doesn't
// trip the backend's uniqueness check or overwrite a concurrent edit.
function changedFields(user: User, form: FormState): Omit<UpdateUserRequest, 'id'> {
  const changes: Omit<UpdateUserRequest, 'id'> = {};
  if (form.name.trim() !== user.name) changes.name = form.name.trim();
  if (form.email.trim() !== user.email) changes.email = form.email.trim();
  if (form.role !== user.role) changes.role = form.role;
  if (form.active !== user.active) changes.active = form.active;
  return changes;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null opens the dialog in create mode.
  user: User | null;
  // Admins can't demote or deactivate themselves — it would lock them out
  // of this page mid-session.
  isSelf: boolean;
  onSaved: (user: User) => void;
}

export function UserFormDialog({ open, onOpenChange, user, isSelf, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = user !== null;

  useEffect(() => {
    if (open) {
      setForm(toForm(user));
      setError(null);
    }
  }, [open, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const changes = isEdit ? changedFields(user, form) : null;
  const canSubmit =
    !saving &&
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    (isEdit ? Object.keys(changes ?? {}).length > 0 : form.password.length >= MIN_PASSWORD_LENGTH);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError(null);
    const result = isEdit
      ? await updateUser({ id: user.id, ...changes })
      : await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
    setSaving(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Could not save the user. Try again.');
      return;
    }

    onSaved(result.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'Add user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update profile details, role, or access.'
              : 'Create an account. Share the temporary password with them directly.'}
          </DialogDescription>
        </DialogHeader>

        <form id="user-form" onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Name</span>
            <input
              required
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={fieldInputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={fieldInputClass}
            />
          </label>

          {!isEdit && (
            <label className="block space-y-1.5">
              <span className={fieldLabelClass}>Temporary password</span>
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className={fieldInputClass}
              />
              <span className="block text-[11px] text-muted-foreground">
                At least {MIN_PASSWORD_LENGTH} characters.
              </span>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Role</span>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value as UserRole)}
              disabled={isSelf}
              className={fieldInputClass}
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>

          {isEdit && (
            <label className="flex items-center justify-between gap-3 border border-border px-3 py-3">
              <span>
                <span className="block text-sm font-medium text-foreground">Active</span>
                <span className="block text-xs text-muted-foreground">
                  Inactive users can&apos;t sign in.
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                disabled={isSelf}
                className="size-4 accent-primary"
              />
            </label>
          )}

          {isSelf && (
            <p className="text-xs text-muted-foreground">
              You can&apos;t change your own role or deactivate yourself.
            </p>
          )}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={!canSubmit}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserFormDialog;
