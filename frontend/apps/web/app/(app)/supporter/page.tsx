import { auth } from '@feature/auth/server';
import { getInterviewProcesses, getInterviewSessions } from '@feature/backend/server';
import { buildActivityFeed } from '@app/web/lib/supporter/activity-feed';
import { DashboardNextSessionCard } from '@app/web/components/supporter/dashboard-next-session-card';
import { AwaitingFeedbackList } from '@app/web/components/supporter/awaiting-feedback-list';
import { ActiveProcessesSummary } from '@app/web/components/supporter/active-processes-summary';
import { ProcessUpdatesFeed } from '@app/web/components/supporter/process-updates-feed';

// No pagination UI on this page yet — fetch a generously large page so the
// dashboard summaries are effectively complete for current data volumes.
const MAX = 100;

async function SupporterPage() {
  const [session, { data: sessionPage }, { data: processPage }] = await Promise.all([
    auth(),
    getInterviewSessions({ limit: MAX }),
    getInterviewProcesses({ limit: MAX }),
  ]);

  const sessionCards = sessionPage.data;
  const processCards = processPage.data;

  const now = Date.now();
  const upcoming = sessionCards
    .filter((s) => new Date(s.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const nextSession = upcoming[0] ?? null;

  const awaitingFeedback = sessionCards.filter((s) => s.status === 'IN_REVIEW');
  const activeProcesses = processCards.filter((p) => p.status === 'ACTIVE');
  const updates = buildActivityFeed(sessionCards, processCards);

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Supporter Dashboard</p>
        <h1 className="text-4xl font-light tracking-tight md:text-5xl">
          Welcome back, <span className="font-semibold text-primary">{session?.user?.name}</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">Your interview sessions and process activity at a glance</p>
      </div>

      <DashboardNextSessionCard session={nextSession} />

      <ActiveProcessesSummary processes={activeProcesses} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AwaitingFeedbackList sessions={awaitingFeedback} />
        <ProcessUpdatesFeed updates={updates} />
      </div>
    </div>
  );
}

export default SupporterPage;
