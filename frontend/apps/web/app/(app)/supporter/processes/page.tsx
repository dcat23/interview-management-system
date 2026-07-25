import { getCandidates, getClients, getInterviewProcesses, getSessionsByProcess } from '@feature/backend/server';
import type { InterviewProcess } from '@feature/base/server';
import { ProcessCard, type ProcessCardData } from '@app/web/components/supporter/process-card';

// No pagination UI on this page yet — fetch a generously large page so the
// "all processes" read-only view is effectively complete for current data volumes.
const MAX_PROCESSES = 100;

async function buildProcessCards(processes: InterviewProcess[]): Promise<ProcessCardData[]> {
  const candidateIds = [...new Set(processes.map((p) => p.candidateId))];

  const [clientsResult, candidatesResult, sessionsByProcess] = await Promise.all([
    getClients({ limit: MAX_PROCESSES }),
    getCandidates({ ids: candidateIds, limit: Math.max(candidateIds.length, 1) }),
    Promise.all(processes.map((p) => getSessionsByProcess(p.id))),
  ]);

  const clientNameById = new Map(clientsResult.data.data.map((c) => [c.id, c.name]));
  const candidateNameById = new Map(candidatesResult.data.data.map((c) => [c.id, c.name]));

  return processes.map((process, index) => {
    const sessions = sessionsByProcess[index].data;
    const latest = [...sessions].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )[0];

    return {
      ...process,
      candidateName: candidateNameById.get(process.candidateId) ?? 'Unknown candidate',
      clientName: clientNameById.get(process.clientId) ?? 'Unknown client',
      currentRound: latest?.round ?? null,
      sessionCount: sessions.length,
    };
  });
}

async function SupporterProcessesPage() {
  const { data: processPage } = await getInterviewProcesses({ limit: MAX_PROCESSES });
  const processCards = await buildProcessCards(processPage.data);

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
