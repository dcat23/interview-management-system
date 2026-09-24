'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { createProcess, lookupProcessTechnologies } from '@feature/backend/server';
import { extractJobId, type Client, type InterviewProcess, type UserLookup } from '@feature/base/server';
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
import { ClientLookupField } from './client-lookup-field';
import { UserLookupField } from './user-lookup-field';
import { ValueAutocompleteField } from './value-autocomplete-field';

async function lookupTechnologies(query: string) {
  const { data } = await lookupProcessTechnologies(query);
  return data ?? [];
}

interface FormState {
  candidate: UserLookup | null;
  client: Client | null;
  technology: string;
  jobId: string;
  // Once the user types their own job ID, stop overwriting it from the technology.
  jobIdEdited: boolean;
  description: string;
}

const EMPTY_FORM: FormState = {
  candidate: null,
  client: null,
  technology: '',
  jobId: '',
  jobIdEdited: false,
  description: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The signed-in marketer owns every process created from their dashboard.
  marketerId: string;
  onCreated?: (process: InterviewProcess) => void;
}

export function NewProcessDrawer({ open, onOpenChange, marketerId, onCreated }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
    }
  }, [open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Same trailing "(9548BR)" parse the schedule import applies, kept in sync
  // until the user edits the job ID by hand. Clearing it resumes auto-fill on
  // the next technology change.
  const setTechnology = (technology: string) =>
    setForm((prev) => ({
      ...prev,
      technology,
      jobId: prev.jobIdEdited ? prev.jobId : (extractJobId(technology) ?? ''),
    }));

  const setJobId = (jobId: string) =>
    setForm((prev) => ({ ...prev, jobId, jobIdEdited: jobId.trim() !== '' }));

  const canSubmit =
    !saving && form.candidate !== null && form.client !== null && form.technology.trim() !== '';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !form.candidate || !form.client) return;

    setSaving(true);
    setError(null);
    const result = await createProcess({
      candidateId: form.candidate.id,
      clientId: form.client.id,
      marketerId,
      technology: form.technology.trim(),
      jobId: form.jobId.trim() || undefined,
      description: form.description.trim() || undefined,
    });
    setSaving(false);

    if (!result.success || !result.data) {
      setError(result.message ?? 'Could not create the process. Try again.');
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['processes'] });
    onOpenChange(false);
    // POST /processes doesn't join names into its response — backfill from
    // the picked candidate/client so the confirmation and session drawer can show them.
    onCreated?.({
      ...result.data,
      candidateName: result.data.candidateName ?? form.candidate.name,
      clientName: result.data.clientName ?? form.client.name,
    });
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>New process</DrawerTitle>
          <DrawerDescription>Open an interview process for a candidate with a client.</DrawerDescription>
        </DrawerHeader>

        <form
          id="new-process-form"
          onSubmit={onSubmit}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-5"
        >
          <UserLookupField
            label="Candidate"
            role="CANDIDATE"
            value={form.candidate}
            onChange={(candidate) => set('candidate', candidate)}
            disabled={saving}
          />

          <ClientLookupField
            value={form.client}
            onChange={(client) => set('client', client)}
            disabled={saving}
          />

          <ValueAutocompleteField
            label="Technology"
            required
            value={form.technology}
            onChange={setTechnology}
            lookupKey="process-technologies"
            lookup={lookupTechnologies}
            placeholder="e.g. Java Developer (9548BR)"
            disabled={saving}
          />

          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Job ID (optional)</span>
            <input
              value={form.jobId}
              onChange={(e) => setJobId(e.target.value)}
              disabled={saving}
              className={fieldInputClass}
            />
            {!form.jobIdEdited && form.jobId !== '' && (
              <span className="block text-[11px] text-muted-foreground">Parsed from technology.</span>
            )}
          </label>

          <label className="block space-y-1.5">
            <span className={fieldLabelClass}>Description (optional)</span>
            <textarea
              rows={4}
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
          <Button type="submit" form="new-process-form" disabled={!canSubmit}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            Create process
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default NewProcessDrawer;
