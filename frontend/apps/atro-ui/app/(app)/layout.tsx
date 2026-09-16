import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { AppHeader } from '@app/atro-ui/components/app/app-header';

interface Props {
  children: ReactNode;
}

export default async function AppLayout({ children }: Props) {
  const session = await auth();

  if (!session?.user?.role || session.error) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader email={session.user.email} role={session.user.role} />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</div>
      </main>
    </div>
  );
}
