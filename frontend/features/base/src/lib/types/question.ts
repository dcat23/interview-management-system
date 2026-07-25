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
