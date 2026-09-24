'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon, XIcon } from 'lucide-react';
import { createSession, lookupSessionModes, lookupSessionRounds } from '@feature/backend/server';
import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import type { InterviewProcess, InterviewSession, UserLookup } from '@feature/base/server';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@app/atro-ui/components/ui/common/drawer';
import { fieldInputClass, fieldLabelClass } from '@app/atro-ui/components/supporter/settings-fields';
import { useDebouncedValue } from '@app/atro-ui/hooks/ui/use-debounced-value';
import { AnimatedCalendar } from '@app/atro-ui/components/ui/common/calender';
import { UserLookupField } from './user-lookup-field';
import { ValueAutocompleteField } from './value-autocomplete-field';

const DEFAULT_DURATION_MINUTES = 60;

async function lookupModes(query: string) {
  const { data } = await lookupSessionModes(query);
  return data ?? [];
}

async function lookupRounds(query: string) {
  const { data } = await lookupSessionRounds(query);
  return data ?? [];
}

interface FormState {
  process: InterviewProcess | null;
  supporter: UserLookup | null;
  round: string;
  mode: string;
  durationMinutes: string;
  scheduledAt: Date | undefined;
  description: string;
}

function emptyForm(process: InterviewProcess | null): FormState {
  return {
    process,
    supporter: null,
    round: '',
    mode: '',
    durationMinutes: String(DEFAULT_DURATION_MINUTES),
    scheduledAt: undefined,
    description: '',
  };
}

function processLabel(process: InterviewProcess) {
  return `${process.candidateName ?? 'Unknown candidate'} · ${process.clientName ?? 'Unknown client'}`;
}

interface ProcessPickerProps {
  value: InterviewProcess | null;
  onChange: (process: InterviewProcess | null) => void;
  disabled?: boolean;
}

function ProcessPicker({ value, onChange, disabled }: ProcessPickerProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const { data, isFetching } = useProcesses({
    page: 0,
    limit: 10,
    status: 'ACTIVE',
    search: debouncedQuery || undefined,
    sort: 'updatedAt,desc',
  });
  const processes = data?.data ?? [];

  if (value) {
    return (
      <div className="space-y-1.5">
        <span className={fieldLabelClass}>Process</span>
        <div className="flex min-h-11 items-center justify-between gap-2 border border-border bg-background px-3 py-2 text-sm">
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{processLabel(value)}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {value.technology}
              {value.currentRound ? ` · ${value.currentRound}` : ''}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            aria-label="Clear process"
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
        <span className={fieldLabelClass}>Process</span>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search active processes…"
            disabled={disabled}
            className={fieldInputClass}
          />
          {isFetching && (
            <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </label>

      <ul className="max-h-48 overflow-y-auto border border-border bg-background">
        {processes.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            {isFetching ? 'Loading…' : 'No active processes.'}
          </li>
        ) : (
          processes.map((process) => (
            <li key={process.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(process);
                  setQuery('');
                }}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="block truncate text-sm text-foreground">{processLabel(process)}</span>
                <span className="block truncate text-xs text-muted-foreground">{process.technology}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Preselects the process, e.g. right after creating one.
  initialProcess?: InterviewProcess | null;
  onScheduled?: (session: InterviewSession) => void;
}

export function ScheduleSessionDrawer({ open, onOpenChange, initialProcess = null, onScheduled }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => emptyForm(initialProcess));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm(initialProcess));
      setError(null);
    }
  }, [open, initialProcess]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const duration = Number(form.durationMinutes);
  const canSubmit =
    !saving &&
    form.process !== null &&
    form.supporter !== null &&
    form.round.trim() !== '' &&
    form.mode.trim() !== '' &&
    Number.isInteger(duration) &&
    duration > 0 &&
    form.scheduledAt !== undefined;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !form.process || !form.supporter || !form.scheduledAt) return;

    setSaving(true);
    setError(null);
    const result = await createSession(form.process.id, {
      supporterId: form.supporter.id,
      round: form.round.trim(),
      mode: form.mode.trim(),
      durationMinutes: duration,
      description: form.description.trim() || undefined,
      // The picker yields a local-time Date; toISOString sends the UTC instant the API expects.
      scheduledAt: form.scheduledAt.toISOString(),
    });
    setSaving(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Could not schedule the session. Try again.');
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['sessions'] });
    void queryClient.invalidateQueries({ queryKey: ['processes'] });
    onOpenChange(false);
    onScheduled?.(result.data);
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Schedule session</DrawerTitle>
          <DrawerDescription>Book an interview round and assign a supporter.</DrawerDescription>
        </DrawerHeader>

        <form
          id="schedule-session-form"
          onSubmit={onSubmit}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5"
        >
          <ProcessPicker
            value={form.process}
            onChange={(process) => set('process', process)}
            disabled={saving}
          />

          <UserLookupField
            label="Supporter"
            role="SUPPORTER"
            value={form.supporter}
            onChange={(supporter) => set('supporter', supporter)}
            disabled={saving}
          />

          <ValueAutocompleteField
            label="Round"
            required
            value={form.round}
            onChange={(round) => set('round', round)}
            lookupKey="session-rounds"
            lookup={lookupRounds}
            placeholder="e.g. Round 1, Technical, Final"
            disabled={saving}
          />

          <div className="space-y-1.5">
            <span className={fieldLabelClass}>Date &amp; time</span>
            <AnimatedCalendar
              mode="single"
              value={form.scheduledAt}
              onChange={(scheduledAt) => set('scheduledAt', scheduledAt)}
              showTime
              use24Hour={false}
              minuteStep={15}
              disablePastDates
              placeholder="Select date and time"
              disabled={saving}
              aria-label="Session date and time"
              className="h-11 w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ValueAutocompleteField
              label="Mode"
              required
              value={form.mode}
              onChange={(mode) => set('mode', mode)}
              lookupKey="session-modes"
              lookup={lookupModes}
              placeholder="e.g. Video call"
              disabled={saving}
            />

            <label className="block space-y-1.5">
              <span className={fieldLabelClass}>Duration (min)</span>
              <input
                required
                type="number"
                min={0}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
                disabled={saving}
                className={fieldInputClass}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Notes (optional)</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              disabled={saving}
              className={`${fieldInputClass} h-auto py-2`}
            />
          </label>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <DrawerFooter className="flex-row justify-end gap-2 border-t border-border/50 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="schedule-session-form" disabled={!canSubmit}>
            {saving && <Loader2Icon className="animate-spin" aria-hidden />}
            Schedule
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ScheduleSessionDrawer;
