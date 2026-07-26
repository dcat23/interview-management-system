import { getCandidates, getClients, getProcessById } from '@feature/backend/server';
import type { InterviewSession } from '@feature/base/server';
import type { SessionCardData } from '@app/web/components/supporter/session-card';

// No pagination UI on the pages that call this yet — fetch a generously
// large page so client/candidate name lookups cover current data volumes.
const MAX_LOOKUP = 100;

export async function buildSessionCards(sessions: InterviewSession[]): Promise<SessionCardData[]> {
  const uniqueProcessIds = [...new Set(sessions.map((s) => s.processId))];

  const [processResults, clientsResult] = await Promise.all([
    Promise.all(uniqueProcessIds.map((id) => getProcessById(id))),
    getClients({ limit: MAX_LOOKUP }),
  ]);

  const processById = new Map(uniqueProcessIds.map((id, index) => [id, processResults[index].data]));
  const clientNameById = new Map(clientsResult.data.data.map((c) => [c.id, c.name]));

  const candidateIds = [...new Set([...processById.values()].map((p) => p.candidateId).filter(Boolean))];
  const candidatesResult = await getCandidates({ ids: candidateIds, limit: Math.max(candidateIds.length, 1) });
  const candidateNameById = new Map(candidatesResult.data.data.map((c) => [c.id, c.name]));

  return sessions.map((session) => {
    const process = processById.get(session.processId);
    const candidateName = process?.candidateId ? candidateNameById.get(process.candidateId) : undefined;
    const clientName = process?.clientId ? clientNameById.get(process.clientId) : undefined;

    return {
      ...session,
      candidateName: candidateName ?? 'Unknown candidate',
      clientName: clientName ?? 'Unknown client',
      technology: process?.technology ?? 'Unknown role',
    };
  });
}
