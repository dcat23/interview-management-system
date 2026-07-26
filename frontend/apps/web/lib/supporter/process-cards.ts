import { getCandidates, getClients, getSessionsByProcess } from '@feature/backend/server';
import type { InterviewProcess } from '@feature/base/server';
import type { ProcessCardData } from '@app/web/components/supporter/process-card';

// No pagination UI on the pages that call this yet — fetch a generously
// large page so client/candidate name lookups cover current data volumes.
const MAX_LOOKUP = 100;

export async function buildProcessCards(processes: InterviewProcess[]): Promise<ProcessCardData[]> {
  const candidateIds = [...new Set(processes.map((p) => p.candidateId))];

  const [clientsResult, candidatesResult, sessionsByProcess] = await Promise.all([
    getClients({ limit: MAX_LOOKUP }),
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
