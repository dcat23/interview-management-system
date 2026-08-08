import { getInterviewProcesses } from '@feature/backend/server';
import { ProcessCard } from '@app/web/components/supporter/process-card';

// No pagination UI on this page yet — fetch a generously large page so the
// "all processes" read-only view is effectively complete for current data volumes.
const MAX_PROCESSES = 100;

async function SupporterProcessesPage() {
  const { data: processPage } = await getInterviewProcesses({ limit: MAX_PROCESSES });
  const processCards = processPage.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Supporter</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Interview Processes</h1>
        <p className="mt-1 text-muted-foreground">
          All active interview processes across clients. Read-only view for supporters.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {processCards.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
      </div>
    </div>
  );
}

export default SupporterProcessesPage;
