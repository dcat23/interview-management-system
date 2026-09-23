import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { ProcessesTable } from '@app/atro-ui/components/supporter/processes-table';

async function AppSupporterProcessesPage() {
  const session = await auth();

  if (session?.user?.role !== 'supporter') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Processes</h1>
        <p className="mt-1 text-muted-foreground">
          Interview processes you support, with their current round and status.
        </p>
      </div>

      <ProcessesTable />
    </div>
  );
}

export default AppSupporterProcessesPage;
