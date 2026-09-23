'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { MeResponse } from '@feature/auth/server';
import type { ApiKey, ApiKeyCreated } from '@feature/base/server';
import { cn } from '@app/atro-ui/lib/ui/utils';
import { ProfileSettings } from '@app/atro-ui/components/supporter/profile-settings';
import { ApiKeySettings } from '@app/atro-ui/components/supporter/api-key-settings';
import {
  SETTINGS_SECTIONS,
  stampClass,
  type SettingsSection,
} from '@app/atro-ui/components/supporter/settings-fields';

interface Props {
  me: MeResponse;
  apiKeys: ApiKey[];
  initialSection: SettingsSection;
}

export function SettingsPanel({ me, apiKeys, initialSection }: Props) {
  const reduce = useReducedMotion();
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const index = SETTINGS_SECTIONS.findIndex((s) => s.id === section);

  const select = (id: SettingsSection) => {
    setSection(id);
    // Shallow URL sync so the section survives a reload / can be linked,
    // without a server round-trip re-fetching both sections' data.
    const url = new URL(window.location.href);
    url.searchParams.set('section', id);
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="grid grid-cols-1 border border-border lg:grid-cols-12">
      {/* Section rail */}
      <aside className="border-b border-border p-6 sm:p-8 lg:col-span-4 lg:border-r lg:border-b-0 lg:p-10">
        <p className={stampClass}>Settings</p>
        <nav aria-label="Settings sections">
          <ol className="mt-6 flex gap-1 overflow-x-auto lg:flex-col lg:space-y-1">
            {SETTINGS_SECTIONS.map((s, i) => {
              const active = s.id === section;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => select(s.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 border-b-2 px-3 py-2.5 text-left text-sm whitespace-nowrap transition-colors',
                      'lg:border-b-0 lg:border-l-2 lg:pr-0 lg:pl-4',
                      active
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className="font-mono text-[11px] tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={cn(active && 'font-medium')}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      {/* Section content */}
      <div className="flex min-h-0 flex-col lg:col-span-8 lg:min-h-105">
        <div className="border-b border-border px-6 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase tabular-nums">
              {String(index + 1).padStart(2, '0')} / {String(SETTINGS_SECTIONS.length).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted-foreground">{me.email}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section}
              className="flex flex-1 flex-col"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {section === 'profile' ? <ProfileSettings me={me} /> : null}
              {section === 'api-keys' ? (
                <ApiKeySettings
                  keys={apiKeys}
                  created={createdKey}
                  onCreatedChange={setCreatedKey}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
