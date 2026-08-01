/**
 * [interview-session]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:36:16 pm
 *
 * Matches InterviewSessionResponse on the backend (session/dto/InterviewSessionResponse.java).
 */
export interface InterviewSession {
  id: string;
  processId: string;
  supporterId: string;
  round: string;
  mode: string;
  durationMinutes: number;
  description: string | null;
  status: SessionStatus;
  scheduledAt: string;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  createdAt: string;
  updatedAt: string;
  candidateName: string | null;
  clientName: string | null;
  technology: string | null;
}

/**
 * [session-status]
 * next-feature@0.1.4-0
 * July 25th 2026, 2:38:23 pm
 *
 * Unlike Role, this is serialized as the raw uppercase Java enum name
 * (Jackson default) — there is no lowercasing step for SessionStatus like
 * there is for Role in AuthService#login. Matches SessionStatus.java.
 */
export type SessionStatus = 'SCHEDULED' | 'IN_REVIEW' | 'PASSED' | 'REJECTED' | 'NO_SHOW' | 'CANCELLED';
