import { ReactNode } from 'react';
import Link from 'next/link';
import { auth, signOutAction } from '@feature/auth/server';
import { Button } from '@feature/ui/components/button';

interface Props {
  children: ReactNode;
}

async function MarketerLayout({ children }: Props) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4">
            <Link
              href="/marketer/processes"
              className="text-sm font-medium hover:underline"
            >
              Processes
            </Link>
            <Link
              href="/marketer/processes/new"
              className="text-sm font-medium hover:underline"
            >
              New Process
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session?.user?.email}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {session?.user?.role}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default MarketerLayout;
