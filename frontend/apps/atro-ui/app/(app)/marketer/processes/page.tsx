import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { NewProcessButton } from '@app/atro-ui/components/marketer/new-process-button';
import { ProcessesTable } from '@app/atro-ui/components/supporter/processes-table';

async function AppMarketerProcessesPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Processes</h1>
          <p className="mt-1 text-muted-foreground">
            Every interview process, with its current round and status.
          </p>
        </div>
        <NewProcessButton marketerId={session.user.id} />
      </div>

      <ProcessesTable basePath="/marketer" />
    </div>
  );
}

export default AppMarketerProcessesPage;
