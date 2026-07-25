/**
 * [interview-process]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:05:30 pm
 *
 * Matches InterviewProcessResponse on the backend (process/dto/InterviewProcessResponse.java).
 */
export interface InterviewProcess {
  id: string;
  candidateId: string;
  clientId: string;
  marketerId: string;
  technology: string;
  description: string | null;
  status: ProcessStatus;
  startedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Serialized as the raw uppercase Java enum name (Jackson default), same as
 * SessionStatus — matches ProcessStatus.java.
 */
export type ProcessStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'CANCELLED';
