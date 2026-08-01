import type { SessionCardData } from '@app/web/components/supporter/session-card';
import type { ProcessCardData } from '@app/web/components/supporter/process-card';

export type ActivityItem = {
  id: string;
  processId: string;
  message: string;
  timestamp: string;
};

const STATUS_LABEL: Record<SessionCardData['status'], string> = {
  SCHEDULED: 'Scheduled',
  IN_REVIEW: 'In Review',
  PASSED: 'Passed',
  REJECTED: 'Rejected',
  NO_SHOW: 'No Show',
  CANCELLED: 'Cancelled',
};

// There is no activity/audit-log endpoint on the backend yet, so this feed is
// derived from timestamps we already fetch for the sessions/processes lists:
// a session status change (statusChangedAt) or a process being opened
// (createdAt). Newest first, most recent N.
export function buildActivityFeed(
  sessions: SessionCardData[],
  processes: ProcessCardData[],
  limit = 8,
): ActivityItem[] {
  const sessionEvents: ActivityItem[] = sessions
    .filter((s) => s.statusChangedAt)
    .map((s) => ({
      id: `session-${s.id}`,
      processId: s.processId,
      message: `${s.candidateName} — ${s.technology} ${s.round} marked ${STATUS_LABEL[s.status]}`,
      timestamp: s.statusChangedAt as string,
    }));

  const processEvents: ActivityItem[] = processes.map((p) => ({
    id: `process-${p.id}`,
    processId: p.id,
    message: `${p.candidateName} — ${p.technology} process created`,
    timestamp: p.createdAt,
  }));

  return [...sessionEvents, ...processEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
