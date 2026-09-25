import { cn } from '@app/atro-ui/lib/ui/utils';

// Lives here rather than in settings-panel.tsx: the page (a server component)
// reads it, and values exported from a 'use client' module arrive there as
// client references, not the array itself.
export const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'api-keys', label: 'API keys' },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]['id'];
export type SettingsSectionItem = (typeof SETTINGS_SECTIONS)[number];

// API keys are admin/supporter-only on the backend, so marketers get profile alone.
export const MARKETER_SETTINGS_SECTIONS: readonly SettingsSectionItem[] = SETTINGS_SECTIONS.filter(
  (s) => s.id === 'profile',
);

// Shared class strings for the settings sections. Mirrors the contact-form /
// project-planner blocks, mapped onto the app's shadcn tokens (border,
// primary) since the blocks' brand/border-subtle tokens aren't defined here.

export const stampClass =
  'text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase';

export const fieldLabelClass = 'text-xs font-medium text-muted-foreground';

export const fieldInputClass = cn(
  'h-11 w-full border border-border bg-background px-3 text-base text-foreground sm:text-sm',
  'placeholder:text-muted-foreground/60',
  'transition-[border-color,box-shadow] duration-200',
  'outline-none focus:border-ring focus:ring-2 focus:ring-ring/20',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

export const primaryButtonClass =
  'inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition-opacity disabled:pointer-events-none disabled:opacity-50';

export const ghostButtonClass =
  'inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormat.format(new Date(value)) : '—';
}
