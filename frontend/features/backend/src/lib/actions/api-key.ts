'use server';

import { withApi } from '@next-feature/client/server';
import { z } from 'zod';
import api from '../config/client';
import type { ApiKey, ApiKeyCreated } from '@feature/base/server';

/**
 * [get-api-keys]
 *
 * GET /api-keys. Returns the caller's own keys only — admin and supporter
 * roles. Not paginated.
 */
export type GetApiKeysResponse = ApiKey[];

export const getApiKeys = withApi(async () => {
  const endpoint = '/api-keys';
  return api.get<GetApiKeysResponse>(endpoint);
}, {});

/**
 * [create-api-key]
 *
 * POST /api-keys. Issues an AI_AGENT-scoped key owned by the caller. The
 * raw key and bearer token are in this response only — surface them
 * immediately, they can't be fetched again.
 */
const createApiKeySchema = z.object({
  name: z.string().trim().min(1),
  expiresInDays: z.number().int().min(1).max(180).optional(),
});
export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;
export type CreateApiKeyResponse = ApiKeyCreated;

export const createApiKey = withApi(async (options: CreateApiKeyRequest) => {
  const parsed = createApiKeySchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = '/api-keys';
  return api.post<CreateApiKeyResponse>(endpoint, parsed.data);
}, {});

/**
 * [revoke-api-key]
 *
 * DELETE /api-keys/:id. Soft-revokes — the key stays in the list with
 * revoked: true. Owner or admin.
 */
const revokeApiKeySchema = z.object({
  id: z.string().uuid(),
});
export type RevokeApiKeyRequest = z.infer<typeof revokeApiKeySchema>;
export type RevokeApiKeyResponse = void;

export const revokeApiKey = withApi(async (options: RevokeApiKeyRequest) => {
  const parsed = revokeApiKeySchema.safeParse(options);

  if (!parsed.success) {
    throw parsed.error;
  }

  const endpoint = `/api-keys/${parsed.data.id}`;
  return api.delete<RevokeApiKeyResponse>(endpoint);
}, {});
