/**
 * [session-question]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:12:56 pm
 *
 * Matches SessionQuestionResponse on the backend (question/dto/SessionQuestionResponse.java).
 */
export interface SessionQuestion {
  id: string;
  sessionId: string;
  questionId: string;
  displayOrder: number;
  notes: string | null;
  createdAt: string;
}

/**
 * Matches QuestionResponse on the backend (question/dto/QuestionResponse.java).
 */
export interface Question {
  id: string;
  clientId: string;
  topic: string;
  round: string;
  body: string;
  version: number;
  active: boolean;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Matches SessionQuestionBulkItemResult.Outcome on the backend
 * (question/dto/SessionQuestionBulkItemResult.java).
 */
export type SessionQuestionBulkOutcome = 'CREATED' | 'FAILED';

/**
 * Per-item outcome of a POST /sessions/{sessionId}/questions/bulk call. Matches
 * SessionQuestionBulkItemResult on the backend (question/dto/SessionQuestionBulkItemResult.java).
 * `questionId`/`sessionQuestionId` are set only when `outcome` is CREATED; `error` only when FAILED.
 */
export interface SessionQuestionBulkItemResult {
  itemIndex: number;
  outcome: SessionQuestionBulkOutcome;
  questionId: string | null;
  sessionQuestionId: string | null;
  error: string | null;
}

/**
 * Matches SessionQuestionBulkSummaryResponse on the backend
 * (question/dto/SessionQuestionBulkSummaryResponse.java). One bad item doesn't fail the whole
 * batch — check `results[].outcome` rather than assuming `created === totalItems`.
 */
export interface SessionQuestionBulkSummary {
  totalItems: number;
  created: number;
  failed: number;
  results: SessionQuestionBulkItemResult[];
}
