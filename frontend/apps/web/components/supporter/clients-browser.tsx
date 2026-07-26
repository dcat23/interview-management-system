'use client';

import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import type { Client } from '@feature/base/server';
import { ClientCard } from '@app/web/components/supporter/client-card';
import { ClientSearchInput } from '@app/web/components/supporter/client-search-input';
import { EmptyState } from '@app/web/components/supporter/empty-state';

interface Props {
  clients: Client[];
}

export function ClientsBrowser(props: Props) {
  const { clients } = props;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, clients]);

  return (
    <div className="space-y-8">
      <div className="max-w-md">
        <ClientSearchInput value={query} onChange={setQuery} />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No clients found" description="Try a different name" />
      )}
    </div>
  );
}
