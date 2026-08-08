import { getClients } from '@feature/backend/server';
import { ClientsBrowser } from '@app/web/components/supporter/clients-browser';

// No pagination UI on this page yet — fetch a generously large page so the
// "all clients" read-only view is effectively complete for current data volumes.
const MAX_CLIENTS = Number.MAX_SAFE_INTEGER;

async function SupporterClientsPage() {
  const { data: clientPage } = await getClients({ limit: MAX_CLIENTS, sort: "name,asc" });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Clients</h1>
        <p className="mt-1 text-muted-foreground">End clients you can support across the program</p>
      </div>

      <ClientsBrowser clients={clientPage.data} />
    </div>
  );
}

export default SupporterClientsPage;
