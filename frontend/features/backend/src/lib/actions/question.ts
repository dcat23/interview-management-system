'use server';

import { withApi, withForm } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import { SessionQuestion } from '@feature/base/server';

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
