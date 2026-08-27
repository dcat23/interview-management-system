'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import {
  Page,
  Pageable,
  Question,
  SessionQuestion,
  SessionQuestionBulkSummary,
  toRecord,
} from '@feature/base/server';

/**
 * [get-questions]
 *
 * `q` runs a full-text search (topic + body, ranked by relevance) on the
 * backend via plainto_tsquery. When `q` is present the backend ignores
 * `topic` — see GET /questions in the API reference.
 */
export type GetQuestionsRequest = Pageable & {
  clientId?: string;
  topic?: string;
  q?: string;
};

export type GetQuestionsResponse = Page<Question>;

export const getQuestions = withApi(
  async (options?: GetQuestionsRequest) => {
    const params = new URLSearchParams(toRecord(options));
    const endpoint = '/questions?' + params.toString();

    return api.get<GetQuestionsResponse>(endpoint);
  },
  {
    fallbackData: { data: [], total: 0, page: 0, limit: 0 },
  },
);

/**
 * [export-questions-by-client]
 *
 * GET /questions/export — markdown of the question bank grouped by client. `clientId`
 * scopes it to one client; omitted, the backend exports every client. Returns raw
 * markdown text (not JSON) — the backend sets a Content-Disposition attachment header,
 * but we ignore its suggested filename and build our own on the frontend.
 */
export const exportQuestionsByClient = withApi(async (clientId?: string) => {
  const params = new URLSearchParams(clientId ? { clientId } : undefined);
  const query = params.toString();
  return api.get<string>(`/questions/export${query ? `?${query}` : ''}`);
}, { fallbackData: '' });

/**
 * [export-questions-by-topic]
 *
 * GET /questions/export/by-topic — markdown of the question bank grouped by topic,
 * optionally scoped to `clientId`. Same raw-markdown response shape as
 * exportQuestionsByClient.
 */
export const exportQuestionsByTopic = withApi(async (clientId?: string) => {
  const params = new URLSearchParams(clientId ? { clientId } : undefined);
  const query = params.toString();
  return api.get<string>(`/questions/export/by-topic${query ? `?${query}` : ''}`);
}, { fallbackData: '' });

/**
 * [update-question]
 *
 * PATCH /questions/{id} — partial update of topic/round/body. Backend requires the ADMIN
 * role and snapshots the prior topic/round/body into question_version before applying the
 * change, bumping `version`. Edits the shared question-bank entry, not a session-scoped link
 * — expect other sessions referencing this question to see the update too.
 */
const updateQuestionSchema = z.object({
  topic: z.string().min(1).optional(),
  round: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
});
export type UpdateQuestionRequest = z.infer<typeof updateQuestionSchema>;
export type UpdateQuestionResponse = Question;

export const updateQuestion = withApi(async (
  id: string,
  options: UpdateQuestionRequest
) => {
  const parsed = updateQuestionSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/questions/${id}`;
  const response = await api.patch<Question>(endpoint, parsed.data);
  return response;
}, {});

/**
 * [get-session-questions]
 */
export type GetSessionQuestionsResponse = SessionQuestion[];

export const getSessionQuestions = withApi(async (sessionId: string) => {
  const endpoint = `/sessions/${sessionId}/questions`;
  return api.get<GetSessionQuestionsResponse>(endpoint);
}, { fallbackData: [] });

/**
 * [link-question]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:00:23 pm
 */
const linkQuestionSchema = z.object({
  questionId: z.string().uuid(),
  displayOrder: z.number().int().optional(),
  notes: z.string().optional(),
});
export type LinkQuestionRequest = z.infer<typeof linkQuestionSchema>;
export type LinkQuestionResponse = SessionQuestion;

export const linkQuestion = withApi(async (
  sessionId: string,
  options: LinkQuestionRequest
) => {
  const parsed = linkQuestionSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/sessions/${sessionId}/questions`;
  const response = await api.post<SessionQuestion>(endpoint, parsed.data);
  return response;
}, {});

/**
 * [bulk-create-session-questions]
 *
 * Creates and links a batch of new questions to a session in one call — the endpoint an AI
 * agent's `add_questions_to_session` tool call and this bulk-import path both use. One bad item
 * doesn't fail the whole batch; check `results[].outcome` on the response rather than assuming
 * every item succeeded.
 */
const createSessionQuestionItemSchema = z.object({
  clientId: z.string().uuid(),
  topic: z.string().min(1),
  round: z.string().min(1),
  body: z.string().min(1),
  displayOrder: z.number().int().optional(),
  notes: z.string().optional(),
});
export type CreateSessionQuestionItem = z.infer<typeof createSessionQuestionItemSchema>;

const bulkCreateSessionQuestionsSchema = z.object({
  questions: z.array(createSessionQuestionItemSchema).min(1),
});
export type BulkCreateSessionQuestionsRequest = z.infer<typeof bulkCreateSessionQuestionsSchema>;
export type BulkCreateSessionQuestionsResponse = SessionQuestionBulkSummary;

export const bulkCreateSessionQuestions = withApi(async (
  sessionId: string,
  options: BulkCreateSessionQuestionsRequest
) => {
  const parsed = bulkCreateSessionQuestionsSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/sessions/${sessionId}/questions/bulk`;
  const response = await api.post<SessionQuestionBulkSummary>(endpoint, parsed.data);
  return response;
}, {});

/**
 * [unlink-question]
 * next-feature@0.1.4-0
 * July 25th 2026, 3:01:44 pm
 */
const unlinkQuestionSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid()
});
export type UnlinkQuestionRequest = z.infer<typeof unlinkQuestionSchema>;
export type UnlinkQuestionResponse = {};

export const unlinkQuestion = withApi(
  async (options: UnlinkQuestionRequest) => {
    const parsed = unlinkQuestionSchema.safeParse(options);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { sessionId, questionId } = parsed.data;

    const endpoint = `/sessions/${sessionId}/questions/${questionId}`;
    const response = await api.delete<UnlinkQuestionResponse>(endpoint);
    return response;
  },
  {},
);
