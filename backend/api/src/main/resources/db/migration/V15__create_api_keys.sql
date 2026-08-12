CREATE TYPE api_key_scope AS ENUM ('ai_agent');

CREATE TABLE api_keys (
    id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     uuid          NOT NULL REFERENCES users (id),
    name         varchar(255)  NOT NULL,
    key_prefix   varchar(12)   NOT NULL,
    key_hash     varchar(64)   NOT NULL UNIQUE,
    scope        api_key_scope NOT NULL DEFAULT 'ai_agent',
    revoked      boolean       NOT NULL DEFAULT false,
    revoked_at   timestamptz,
    expires_at   timestamptz   NOT NULL,
    last_used_at timestamptz,
    created_at   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_owner    ON api_keys (owner_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_revoked  ON api_keys (revoked);
