import type { InterviewSession } from './session';

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
  candidateName: string | null;
  clientId: string;
  clientName: string | null;
  marketerId: string;
  technology: string;
  description: string | null;
  status: ProcessStatus;
  startedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Only populated by GET /processes/:id - null on list responses (GET /processes). */
  sessions: InterviewSession[] | null;
}

/**
 * Serialized as the raw uppercase Java enum name (Jackson default), same as
 * SessionStatus — matches ProcessStatus.java.
 */
export type ProcessStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'CANCELLED';
