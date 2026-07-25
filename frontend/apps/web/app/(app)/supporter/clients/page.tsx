'use client';

import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { clients } from '@app/web/lib/data/clients';
import { ClientCard } from '@app/web/components/supporter/client-card';
import { ClientSearchInput } from '@app/web/components/supporter/client-search-input';
import { EmptyState } from '@app/web/components/supporter/empty-state';

function SupporterClientsPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Clients</h1>
        <p className="mt-1 text-muted-foreground">End clients you can support across the program</p>
      </div>

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

export default SupporterClientsPage;
