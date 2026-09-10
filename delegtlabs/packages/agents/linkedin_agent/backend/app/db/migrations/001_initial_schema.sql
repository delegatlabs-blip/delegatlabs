-- Migration: 001_initial_schema
-- AntGrav LinkedIn Content Agent

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'pending_review', 'approved', 'published', 'failed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE performance_source AS ENUM ('api', 'manual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('generate', 'publish', 'feedback', 'manual_trigger');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- linkedin_accounts
-- =============================================
CREATE TABLE IF NOT EXISTS linkedin_accounts (
  id            SERIAL PRIMARY KEY,
  member_urn    TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  email         TEXT,
  access_token_enc TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- topics
-- =============================================
CREATE TABLE IF NOT EXISTS topics (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  slug      TEXT NOT NULL UNIQUE,
  weight    NUMERIC(4,3) DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- posts
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id                SERIAL PRIMARY KEY,
  topic_id          INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  source_url        TEXT,
  prompt_text       TEXT,
  generated_text    TEXT,
  image_prompt      TEXT,
  image_url         TEXT,
  linkedin_image_urn TEXT,
  status            post_status DEFAULT 'draft',
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  linkedin_post_urn TEXT,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);

-- =============================================
-- post_performance
-- =============================================
CREATE TABLE IF NOT EXISTS post_performance (
  id          SERIAL PRIMARY KEY,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  likes       INTEGER DEFAULT 0,
  comments    INTEGER DEFAULT 0,
  shares      INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  score       NUMERIC(8,3),
  source      performance_source NOT NULL DEFAULT 'manual',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_performance_post_id ON post_performance(post_id);
CREATE INDEX IF NOT EXISTS idx_post_performance_recorded_at ON post_performance(recorded_at);

-- =============================================
-- jobs
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
  id           SERIAL PRIMARY KEY,
  type         job_type NOT NULL,
  status       job_status DEFAULT 'pending',
  payload      JSONB DEFAULT '{}',
  result       JSONB,
  error_message TEXT,
  run_at       TIMESTAMPTZ DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_run_at ON jobs(run_at);

-- =============================================
-- settings
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_linkedin_accounts_updated_at
    BEFORE UPDATE ON linkedin_accounts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO topics (name, slug, weight, is_active) VALUES
  ('React New Feature',    'react-new-feature',   0.5, true),
  ('Next.js New Feature',  'nextjs-new-feature',  0.5, true),
  ('React vs Next.js',     'react-vs-nextjs',     0.5, true),
  ('Dev Opinion',          'dev-opinion',          0.4, true),
  ('Performance Tip',      'performance-tip',      0.4, true),
  ('Migration Story',      'migration-story',      0.3, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('auto_publish_enabled',  'false',    'When true, posts skip pending_review and publish on schedule'),
  ('posts_per_week',        '3',        'Target number of posts per week'),
  ('default_tone',          'casual',   'casual | formal | witty'),
  ('post_length',           'medium',   'short | medium | long'),
  ('hashtag_count',         '4',        'Number of hashtags to append'),
  ('publish_cron_interval', '5',        'Minutes between publish job checks'),
  ('feedback_cron_hour',    '2',        'Hour (UTC) to run nightly feedback job'),
  ('linkedin_version',      '202401',   'LinkedIn API version header YYYYMM'),
  ('token_expiry_warn_days','7',        'Days before token expiry to show warning banner')
ON CONFLICT (key) DO NOTHING;
