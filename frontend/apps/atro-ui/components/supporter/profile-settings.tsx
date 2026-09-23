'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Loader2, LogIn, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { signOutAction, updateMe, type MeResponse } from '@feature/auth/server';
import { capitalize } from '@feature/base/server';
import {
  fieldInputClass,
  fieldLabelClass,
  formatDate,
  ghostButtonClass,
  primaryButtonClass,
  stampClass,
} from '@app/atro-ui/components/supporter/settings-fields';

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'reauth' }
  | { kind: 'error'; message: string };

interface Props {
  me: MeResponse;
}

export function ProfileSettings({ me }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState({ name: me.name, email: me.email });
  const [form, setForm] = useState(saved);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const nameChanged = form.name.trim() !== saved.name;
  const emailChanged = form.email.trim() !== saved.email;
  const dirty = nameChanged || emailChanged;
  const canSave = dirty && !!form.name.trim() && !!form.email.trim();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setStatus({ kind: 'saving' });
    const result = await updateMe({
      ...(nameChanged ? { name: form.name.trim() } : {}),
      ...(emailChanged ? { email: form.email.trim() } : {}),
    });

    if (!result.success || !result.data) {
      setStatus({
        kind: 'error',
        message: result.message ?? 'Could not update your profile. Try again.',
      });
      return;
    }

    const next = { name: result.data.name, email: result.data.email };
    setSaved(next);
    setForm(next);

    // The access token's subject is the email, so the current session stops
    // resolving to this user once it changes — a fresh sign-in is required.
    if (emailChanged) {
      setStatus({ kind: 'reauth' });
      return;
    }

    setStatus({ kind: 'saved' });
    toast.success('Profile updated');
    router.refresh();
  };

  if (status.kind === 'reauth') {
    return (
      <motion.section
        className="flex flex-col gap-4"
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Check className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-foreground">
            Email updated.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Sign in again with <span className="font-medium text-foreground">{saved.email}</span>{' '}
            to keep going — your current session still uses the old address.
          </p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={primaryButtonClass}>
            Sign in again
            <LogIn className="size-3.5" aria-hidden />
          </button>
        </form>
      </motion.section>
    );
  }

  const buttonKey =
    status.kind === 'saving' ? 'saving' : status.kind === 'saved' && !dirty ? 'saved' : 'save';

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className={stampClass}>Profile</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
          Your details
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          How you appear to marketers and candidates on sessions.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                setStatus({ kind: 'idle' });
              }}
              autoComplete="name"
              className={fieldInputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setStatus({ kind: 'idle' });
              }}
              autoComplete="email"
              className={fieldInputClass}
            />
          </label>
        </div>

        <AnimatePresence initial={false}>
          {emailChanged ? (
            <motion.p
              className="text-xs text-muted-foreground"
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              Changing your email signs you out — you&apos;ll sign in again with the new
              address.
            </motion.p>
          ) : null}
        </AnimatePresence>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium text-foreground">{capitalize(me.role)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium text-foreground">{me.active ? 'Active' : 'Inactive'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border pb-2">
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="font-medium text-foreground">{formatDate(me.createdAt)}</dd>
          </div>
        </dl>

        {status.kind === 'error' ? (
          <p className="text-sm text-destructive" role="alert">
            {status.message}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <button
            type="button"
            disabled={!dirty || status.kind === 'saving'}
            onClick={() => {
              setForm(saved);
              setStatus({ kind: 'idle' });
            }}
            className={ghostButtonClass}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
          <button
            type="submit"
            disabled={!canSave || status.kind === 'saving'}
            className={primaryButtonClass}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={buttonKey}
                className="inline-flex items-center gap-2"
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                {buttonKey === 'saving' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : buttonKey === 'saved' ? (
                  <>
                    Saved
                    <Check className="size-3.5" aria-hidden />
                  </>
                ) : (
                  'Save changes'
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </form>
    </section>
  );
}
