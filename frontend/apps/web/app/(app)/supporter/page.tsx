import { auth } from '@feature/auth/server';
import { sessions } from '@app/web/lib/data/sessions';
import { activeProcesses, processUpdates } from '@app/web/lib/data/processes';
import { DashboardNextSessionCard } from '@app/web/components/supporter/dashboard-next-session-card';
import { AwaitingFeedbackList } from '@app/web/components/supporter/awaiting-feedback-list';
import { ActiveProcessesSummary } from '@app/web/components/supporter/active-processes-summary';
import { ProcessUpdatesFeed } from '@app/web/components/supporter/process-updates-feed';

async function SupporterPage() {
  const session = await auth();

  const upcoming = [...sessions]
    .filter((s) => s.timing === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextSession = upcoming[0] ?? null;

  const awaitingFeedback = sessions.filter((s) => s.timing === 'past' && !s.feedback.submitted);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Supporter Dashboard</p>
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          Welcome back, <span className="font-semibold text-primary">{session?.user?.email}</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">Your interview sessions and process activity at a glance</p>
      </div>

      <DashboardNextSessionCard session={nextSession} />

      <ActiveProcessesSummary processes={activeProcesses} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AwaitingFeedbackList sessions={awaitingFeedback} />
        <ProcessUpdatesFeed updates={processUpdates} />
      </div>
    </div>
  );
}

export default SupporterPage;
