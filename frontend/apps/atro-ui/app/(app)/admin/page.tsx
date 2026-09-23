import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';

async function AppAdminPage() {
  const session = await auth();

  if (session?.user?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back{session.user.name ? `, ${session.user.name}` : ''}.
        </p>
      </div>
    </div>
  );
}

export default AppAdminPage;
