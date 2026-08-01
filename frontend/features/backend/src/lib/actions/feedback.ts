'use server';

import { withApi } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import type { Feedback } from '@feature/base/server';

/**
 * [get-feedback]
 *
 * GET /sessions/:id/feedback. Any admin, marketer, or supporter may read
 * this for any session (view-all). Returns 404 when no feedback record
 * exists yet — callers should check response.error?.isNotFound to
 * distinguish that from a real failure.
 */
export type GetFeedbackResponse = Feedback;

export const getFeedback = withApi(async (sessionId: string) => {
  const endpoint = `/sessions/${sessionId}/feedback`;
  return api.get<GetFeedbackResponse>(endpoint);
}, {});

/**
 * [create-feedback-draft]
 *
 * POST /sessions/:id/feedback. Only the session's assigned supporter may
 * call this — supporterId is set server-side from the JWT. 409 if a
 * feedback record already exists for the session.
 */
const createFeedbackSchema = z.object({
  body: z.string().min(1),
});
export type CreateFeedbackRequest = z.infer<typeof createFeedbackSchema>;
export type CreateFeedbackResponse = Feedback;

export const createFeedback = withApi(async (sessionId: string, options: CreateFeedbackRequest) => {
  const parsed = createFeedbackSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/sessions/${sessionId}/feedback`;
  return api.post<CreateFeedbackResponse>(endpoint, parsed.data);
}, {});

/**
 * [update-feedback]
 *
 * PATCH /sessions/:id/feedback. Only the authoring supporter may call this
 * — edit-own, not view-all. Set isSubmitted: true to lock the record;
 * submittedAt is set server-side. 409 once already submitted.
 */
const updateFeedbackSchema = z.object({
  body: z.string().optional(),
  isSubmitted: z.boolean().optional(),
});
export type UpdateFeedbackRequest = z.infer<typeof updateFeedbackSchema>;
export type UpdateFeedbackResponse = Feedback;

export const updateFeedback = withApi(async (sessionId: string, options: UpdateFeedbackRequest) => {
  const parsed = updateFeedbackSchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/sessions/${sessionId}/feedback`;
  return api.patch<UpdateFeedbackResponse>(endpoint, parsed.data);
}, {});
