/**
 * [feedback]
 *
 * Matches FeedbackResponse on the backend (feedback/dto/FeedbackResponse.java).
 * One record per session (session_id is UNIQUE) — GET is open to any
 * admin/marketer/supporter, but POST/PATCH are scoped to the session's
 * assigned supporter.
 */
export interface Feedback {
  id: string;
  sessionId: string;
  supporterId: string;
  body: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  updatedAt: string;
}
