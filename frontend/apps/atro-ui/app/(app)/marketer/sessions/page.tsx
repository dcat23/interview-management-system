import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { MarketerSessionsTable } from '@app/atro-ui/components/marketer/marketer-sessions-table';

async function AppMarketerSessionsPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="mt-1 text-muted-foreground">
          Every interview session, filterable by status, client, round, and date.
        </p>
      </div>

      <MarketerSessionsTable />
    </div>
  );
}

export default AppMarketerSessionsPage;
