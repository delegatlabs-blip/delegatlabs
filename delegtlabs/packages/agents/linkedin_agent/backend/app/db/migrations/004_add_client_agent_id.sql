-- Migration 004: Add client_agent_id for platform multi-tenancy
-- All columns are nullable to preserve existing single-tenant data.
-- Rows written through the platform integration layer will include the platform's client_agent_id UUID.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS client_agent_id UUID;
ALTER TABLE linkedin_accounts ADD COLUMN IF NOT EXISTS client_agent_id UUID;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS client_agent_id UUID;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS client_agent_id UUID;

CREATE INDEX IF NOT EXISTS idx_posts_client_agent_id ON posts(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_client_agent_id ON linkedin_accounts(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_settings_client_agent_id ON settings(client_agent_id);
CREATE INDEX IF NOT EXISTS idx_topics_client_agent_id ON topics(client_agent_id);

-- OAuth CSRF state storage (replaces in-memory pending_states dict — survives multi-worker restarts)
CREATE TABLE IF NOT EXISTS oauth_states (
    state TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '600 seconds'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
