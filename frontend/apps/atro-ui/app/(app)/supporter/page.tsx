import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { TodaysSessions } from '@app/atro-ui/components/supporter/todays-sessions';

export default async function SupporterPage() {
  const session = await auth();

  if (session?.user?.role !== 'supporter') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Supporter dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back{session.user.name ? `, ${session.user.name}` : ''}. Here&apos;s what&apos;s on today.
        </p>
      </div>

      <TodaysSessions />
    </div>
  );
}
