import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { UsersTable } from '@app/atro-ui/components/admin/users-table';

async function AppAdminUsersPage() {
  const session = await auth();

  if (session?.user?.role !== 'admin') {
    redirect('/login');
  }

  return <UsersTable currentUserEmail={session.user.email} />;
}

export default AppAdminUsersPage;
