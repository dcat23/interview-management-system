import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { ClientsTable } from '@app/atro-ui/components/supporter/clients-table';

async function AppMarketerClientsPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="mt-1 text-muted-foreground">
          Companies candidates are interviewing with. Jump to their processes or sessions.
        </p>
      </div>

      <ClientsTable basePath="/marketer" />
    </div>
  );
}

export default AppMarketerClientsPage;
