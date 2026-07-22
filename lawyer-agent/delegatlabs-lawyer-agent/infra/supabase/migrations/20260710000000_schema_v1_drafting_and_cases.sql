-- Create updated_at utility function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- 1. CORE DRAFTING PERSISTENCE TABLES
-- =========================================================================

-- users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'advocate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- draft_blueprints table
CREATE TABLE IF NOT EXISTS draft_blueprints (
    id VARCHAR(100) PRIMARY KEY,
    draft_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- draft_sessions table
CREATE TABLE IF NOT EXISTS draft_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blueprint_id VARCHAR(100) NOT NULL REFERENCES draft_blueprints(id) ON DELETE RESTRICT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    current_step INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_draft_sessions_status CHECK (status IN ('in_progress', 'completed', 'cancelled'))
);

CREATE TRIGGER update_draft_sessions_updated_at
    BEFORE UPDATE ON draft_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- generated_drafts table
CREATE TABLE IF NOT EXISTS generated_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES draft_sessions(id) ON DELETE CASCADE,
    draft_text TEXT NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    generation_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_generated_drafts_status CHECK (status IN ('draft', 'finalized', 'archived'))
);

CREATE TRIGGER update_generated_drafts_updated_at
    BEFORE UPDATE ON generated_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 2. CASE MANAGEMENT TABLES
-- =========================================================================

-- cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_title VARCHAR(255) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    court_type VARCHAR(100) NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    court_number VARCHAR(50) NULL,
    case_number VARCHAR(100) NULL,
    cnr_number VARCHAR(50) UNIQUE NULL,
    fir_number VARCHAR(100) NULL,
    police_station VARCHAR(255) NULL,
    sections VARCHAR(255) NULL,
    stage VARCHAR(100) NOT NULL,
    remarks TEXT NULL,
    previous_date DATE NULL,
    next_date DATE NULL,
    fof TEXT NULL,
    next_action VARCHAR(255) NULL,
    raw_notes TEXT NULL,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    review_status VARCHAR(50) NOT NULL DEFAULT 'needs_review',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cases_court_type CHECK (court_type IN (
        'High Court', 'District Court', 'Lower Court', 'Civil Court', 
        'Criminal Court', 'Family Court', 'Tribunal', 'Rent Control Authority', 
        'Consumer Forum', 'Other'
    )),
    CONSTRAINT chk_cases_review_status CHECK (review_status IN ('needs_review', 'reviewed', 'confirmed')),
    CONSTRAINT chk_cases_status CHECK (status IN ('active', 'disposed', 'archived'))
);

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- case_parties table
CREATE TABLE IF NOT EXISTS case_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    side_label VARCHAR(50) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    legal_role VARCHAR(100) NOT NULL,
    is_client BOOLEAN NOT NULL DEFAULT FALSE,
    mobile VARCHAR(20) NULL,
    address TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_case_parties_side CHECK (side_label IN ('A', 'B', 'Other')),
    CONSTRAINT chk_case_parties_role CHECK (legal_role IN (
        'Petitioner', 'Respondent', 'Plaintiff', 'Defendant', 'Complainant', 
        'Accused', 'Applicant', 'Opposite Party', 'Appellant', 'Revisionist', 
        'Tenant', 'Landlord', 'State', 'Other'
    ))
);

CREATE TRIGGER update_case_parties_updated_at
    BEFORE UPDATE ON case_parties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- case_dates table
CREATE TABLE IF NOT EXISTS case_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    hearing_date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    judge_remarks TEXT NULL,
    next_date DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- case_tasks table
CREATE TABLE IF NOT EXISTS case_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    task_title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    due_date DATE NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_case_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

CREATE TRIGGER update_case_tasks_updated_at
    BEFORE UPDATE ON case_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- case_notes table
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- case_draft_links table
CREATE TABLE IF NOT EXISTS case_draft_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    draft_session_id UUID NOT NULL REFERENCES draft_sessions(id) ON DELETE CASCADE,
    generated_draft_id UUID NULL REFERENCES generated_drafts(id) ON DELETE SET NULL,
    relationship_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. OUTBOUND REMINDERS & NOTIFICATION LOGS
-- =========================================================================

-- reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    reminder_title VARCHAR(255) NOT NULL,
    trigger_datetime TIMESTAMPTZ NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reminders_channel CHECK (channel IN ('whatsapp', 'email', 'sms')),
    CONSTRAINT chk_reminders_status CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled'))
);

CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channels JSONB NOT NULL DEFAULT '{"whatsapp": true, "email": true, "sms": false}'::jsonb,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- integration_accounts table
CREATE TABLE IF NOT EXISTS integration_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_integration_accounts_status CHECK (status IN ('active', 'inactive', 'revoked'))
);

CREATE TRIGGER update_integration_accounts_updated_at
    BEFORE UPDATE ON integration_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 4. PERFORMANCE INDEXING
-- =========================================================================

-- Case queries indexes
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_cnr ON cases(cnr_number);
CREATE INDEX IF NOT EXISTS idx_cases_next_date ON cases(next_date);

-- Case party indexes
CREATE INDEX IF NOT EXISTS idx_case_parties_case_id ON case_parties(case_id);
CREATE INDEX IF NOT EXISTS idx_case_parties_client ON case_parties(case_id) WHERE is_client = TRUE;

-- Historic case hearing dates
CREATE INDEX IF NOT EXISTS idx_case_dates_case_id ON case_dates(case_id);
CREATE INDEX IF NOT EXISTS idx_case_dates_hearing ON case_dates(hearing_date);

-- Reminders triggers scheduling
CREATE INDEX IF NOT EXISTS idx_reminders_trigger ON reminders(trigger_datetime) WHERE status = 'scheduled';

-- Core drafting sessions mapping
CREATE INDEX IF NOT EXISTS idx_draft_sessions_user ON draft_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_drafts_session ON generated_drafts(session_id);
CREATE INDEX IF NOT EXISTS idx_case_draft_links_case ON case_draft_links(case_id);
