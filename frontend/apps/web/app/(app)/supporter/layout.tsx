import { ReactNode } from 'react';
import { auth } from '@feature/auth/server';
import { Header } from '@app/web/components/supporter/header';

interface Props {
  children: ReactNode;
}

async function SupporterLayout({ children }: Props) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <Header email={session?.user?.email} role={session?.user?.role} />
      <main className="pt-16">
        <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

export default SupporterLayout;
