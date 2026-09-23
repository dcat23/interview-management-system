'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy, Download, KeyRound, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createApiKey, revokeApiKey } from '@feature/backend/server';
import type { ApiKey, ApiKeyCreated } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import {
  fieldInputClass,
  fieldLabelClass,
  formatDate,
  ghostButtonClass,
  primaryButtonClass,
  stampClass,
} from '@app/atro-ui/components/supporter/settings-fields';

const EXPIRY_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 180, label: '180 days' },
] as const;

type KeyState = 'active' | 'expired' | 'revoked';

function keyState(key: ApiKey): KeyState {
  if (key.revoked) return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) return 'expired';
  return 'active';
}

const CSV_COLUMNS: { header: string; value: (key: ApiKeyCreated) => string | null }[] = [
  { header: 'Name', value: (k) => k.name },
  { header: 'Prefix', value: (k) => k.keyPrefix },
  { header: 'API key', value: (k) => k.key },
  { header: 'Bearer token', value: (k) => k.bearerToken },
  { header: 'Created', value: (k) => k.createdAt },
  { header: 'Expires', value: (k) => k.expiresAt },
];

function csvCell(value: string | null): string {
  if (value == null) return '';
  // Key names are user input — keep spreadsheets from evaluating them as formulas.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// The raw key and bearer token only exist in the create response, so this is
// the one chance to save them — there's no way to export them later.
function downloadCreatedKeyCsv(created: ApiKeyCreated) {
  const rows = [
    CSV_COLUMNS.map((c) => c.header),
    CSV_COLUMNS.map((c) => csvCell(c.value(created))),
  ];
  const blob = new Blob([rows.map((r) => r.join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = created.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.href = url;
  link.download = `api-key-${slug || created.keyPrefix}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

interface ChipProps {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Chip({ pressed, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        'border px-3.5 py-2.5 text-left text-sm transition-colors active:scale-[0.99]',
        pressed
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

interface SecretFieldProps {
  label: string;
  hint: string;
  value: string;
}

function SecretField({ label, hint, value }: SecretFieldProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select the value and copy it manually');
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className={fieldLabelClass}>{label}</span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <div className="flex">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(fieldInputClass, 'font-mono text-xs sm:text-xs')}
        />
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="flex size-11 shrink-0 items-center justify-center border border-l-0 border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

interface Props {
  keys: ApiKey[];
  // Owned by the parent so the one-time reveal survives switching sections,
  // which unmounts this component.
  created: ApiKeyCreated | null;
  onCreatedChange: (created: ApiKeyCreated | null) => void;
}

export function ApiKeySettings({ keys, created, onCreatedChange }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [refreshing, startRefresh] = useTransition();
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(90);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Keys come from the server page; refreshing re-runs it so the list stays
  // correct across remounts instead of drifting in local state.
  const refresh = () => startRefresh(() => router.refresh());

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError(null);
    const result = await createApiKey({ name: name.trim(), expiresInDays });
    setCreating(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Could not create the key. Try again.');
      return;
    }

    onCreatedChange(result.data);
    setName('');
    refresh();
  };

  const onRevoke = async (id: string) => {
    setRevokingId(id);
    const result = await revokeApiKey({ id });
    setRevokingId(null);
    setConfirmId(null);

    if (!result.success) {
      toast.error(result.message ?? 'Could not revoke the key');
      return;
    }

    toast.success('Key revoked');
    if (created?.id === id) onCreatedChange(null);
    refresh();
  };

  const sorted = [...keys].sort((a, b) => {
    const rank = { active: 0, expired: 1, revoked: 2 };
    return rank[keyState(a)] - rank[keyState(b)] || b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className={stampClass}>API keys</p>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground">
          Agent access
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Keys let MCP clients and AI agents act on your behalf. Each key is shown once, when
          it&apos;s created — store it somewhere safe.
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div
            key="created"
            className="space-y-4 border border-primary/40 bg-primary/5 p-5"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <KeyRound className="size-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{created.name} is ready</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Copy these now — they won&apos;t be shown again.
                </p>
              </div>
            </div>
            <SecretField label="API key" hint="X-API-Key header" value={created.key} />
            <SecretField
              label="Bearer token"
              hint="Authorization: Bearer — MCP connectors"
              value={created.bearerToken}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => downloadCreatedKeyCsv(created)}
                className={cn(ghostButtonClass, 'border border-border')}
              >
                <Download className="size-3.5" aria-hidden />
                Download CSV
              </button>
              <button type="button" onClick={() => onCreatedChange(null)} className={ghostButtonClass}>
                <Check className="size-3.5" aria-hidden />
                I&apos;ve saved it
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="create"
            onSubmit={onCreate}
            className="space-y-4"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <label className="block space-y-1.5">
              <span className={fieldLabelClass}>Key name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude desktop"
                className={fieldInputClass}
              />
            </label>
            <div>
              <p className={cn(fieldLabelClass, 'mb-2')}>Expires after</p>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.days}
                    pressed={expiresInDays === opt.days}
                    onClick={() => setExpiresInDays(opt.days)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className={primaryButtonClass}
              >
                {creating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    Create key
                    <Plus className="size-3.5" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className={stampClass}>Your keys</p>
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
            {refreshing ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
            {keys.filter((k) => keyState(k) === 'active').length} active
          </p>
        </div>

        {sorted.length === 0 ? (
          <p className="mt-4 border-y border-border py-6 text-sm text-muted-foreground">
            No keys yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {sorted.map((key) => {
              const state = keyState(key);
              const confirming = confirmId === key.id;
              return (
                <li
                  key={key.id}
                  className={cn(
                    'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
                    state !== 'active' && 'opacity-60',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          state === 'active' ? 'bg-primary' : 'bg-muted-foreground/40',
                        )}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium text-foreground">
                        {key.name}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {key.keyPrefix}…
                      </span>
                    </div>
                    <p className="mt-1 pl-3.5 text-xs text-muted-foreground">
                      {state === 'revoked'
                        ? `Revoked ${formatDate(key.revokedAt)}`
                        : `${state === 'expired' ? 'Expired' : 'Expires'} ${formatDate(key.expiresAt)}`}
                      {' · '}
                      {key.lastUsedAt ? `Last used ${formatDate(key.lastUsedAt)}` : 'Never used'}
                    </p>
                  </div>

                  {state === 'active' ? (
                    <div className="flex shrink-0 items-center gap-1 pl-3.5 sm:pl-0">
                      {confirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            disabled={revokingId === key.id}
                            className={ghostButtonClass}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => onRevoke(key.id)}
                            disabled={revokingId === key.id}
                            className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium text-destructive disabled:opacity-40"
                          >
                            {revokingId === key.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : null}
                            Confirm revoke
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(key.id)}
                          className={cn(ghostButtonClass, 'hover:text-destructive')}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="pl-3.5 text-xs capitalize text-muted-foreground sm:pl-0">
                      {state}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
