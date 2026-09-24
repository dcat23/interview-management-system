import { redirect } from 'next/navigation';
import { auth } from '@feature/auth/server';
import { MarketerHeader } from '@app/atro-ui/components/marketer/marketer-header';

export default async function MarketerPage() {
  const session = await auth();

  if (session?.user?.role !== 'marketer') {
    redirect('/login');
  }

  return (
    <div className="flex flex-col gap-6">
      <MarketerHeader marketerId={session.user.id} name={session.user.name} />
    </div>
  );
}
