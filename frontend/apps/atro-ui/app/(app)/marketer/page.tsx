import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { AwaitingDecision } from '@app/atro-ui/components/marketer/awaiting-decision';
import { MarketerHeader } from '@app/atro-ui/components/marketer/marketer-header';
import { MarketerKpis } from '@app/atro-ui/components/marketer/marketer-kpis';
import { RecentProcesses } from '@app/atro-ui/components/marketer/recent-processes';
import { UpcomingSessions } from '@app/atro-ui/components/marketer/upcoming-sessions';

export default async function MarketerPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <MarketerHeader marketerId={session.user.id} name={session.user.name} />
      <MarketerKpis />
      <AwaitingDecision />
      <UpcomingSessions />
      <RecentProcesses />
    </div>
  );
}
