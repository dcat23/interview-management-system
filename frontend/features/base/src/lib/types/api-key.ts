/**
 * [api-key]
 *
 * Matches ApiKeyResponse on the backend (apikey/dto/ApiKeyResponse.java).
 * Listing only ever exposes the prefix — never the hash or raw key.
 */
export type ApiKeyScope = 'AI_AGENT';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  revoked: boolean;
  revokedAt: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * Matches ApiKeyCreatedResponse (apikey/dto/ApiKeyCreatedResponse.java).
 * Returned exactly once from POST /api-keys: `key` is the raw X-API-Key
 * value, `bearerToken` a JWT wrapping the same key for MCP connectors.
 * Neither can be retrieved again.
 */
export interface ApiKeyCreated {
  id: string;
  name: string;
  keyPrefix: string;
  key: string;
  bearerToken: string;
  expiresAt: string | null;
  createdAt: string;
}
