-- Enable pgcrypto for UUID generation if not already enabled (Supabase usually has this by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. AUTH
-- ==========================================

CREATE TABLE college_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT UNIQUE NOT NULL,
    college_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE domain_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    domain TEXT NOT NULL,
    college_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT NOT NULL, -- signup, login
    attempts INT DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ NULL,
    full_name TEXT,
    phone TEXT NULL,
    avatar_url TEXT NULL,
    department TEXT,
    graduation_year INT,
    gender TEXT NULL,
    bio TEXT NULL,
    is_active BOOLEAN DEFAULT false,
    account_status TEXT DEFAULT 'active',
    onboarding_completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. PROFILE
-- ==========================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    block TEXT NOT NULL,
    floor TEXT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_location_ids UUID[],
    walk_radius TEXT,
    preferred_departments TEXT[],
    department_tolerance TEXT,
    year_tolerance TEXT,
    group_size_pref INT[],
    study_style_pref TEXT[],
    time_slots TEXT[],
    subjects_need_help TEXT[],
    subjects_can_teach TEXT[],
    gender_pref TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. SESSIONS
-- ==========================================

CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- pair, group, lobby, alone
    subject TEXT,
    topic TEXT NULL,
    location_id UUID NULL REFERENCES locations(id) ON DELETE SET NULL,
    scheduled_start_at TIMESTAMPTZ NOT NULL,
    scheduled_end_at TIMESTAMPTZ NULL,
    actual_start_at TIMESTAMPTZ NULL,
    actual_end_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL, -- scheduled, active, completed, cancelled, no_show, expired
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- host, participant
    joined_at TIMESTAMPTZ DEFAULT now(),
    left_at TIMESTAMPTZ NULL,
    UNIQUE (session_id, user_id)
);

-- ==========================================
-- 4. MATCHING
-- ==========================================

CREATE TABLE match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired, cancelled
    expires_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_match_requests_receiver_status ON match_requests(receiver_id, status);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NULL REFERENCES study_sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL, -- active, completed, blocked
    matched_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. ACCOUNTABILITY
-- ==========================================

CREATE TABLE accountability_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- session_completed, no_show
    points_delta INT NOT NULL,
    session_id UUID NULL REFERENCES study_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_accountability_events_user_id ON accountability_events(user_id);

CREATE TABLE accountability_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reliability INT NOT NULL DEFAULT 100,
    focus_ratio NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    score INT NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE focus_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NULL REFERENCES study_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- focus, break
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NULL,
    duration_min INT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false
);

-- ==========================================
-- 6. CHAT
-- ==========================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- direct, group
    connection_type TEXT NOT NULL, -- temporary, permanent
    expires_at TIMESTAMPTZ NULL,
    user_a_keep BOOLEAN DEFAULT false,
    user_b_keep BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'open', -- open, closed
    session_id UUID NULL REFERENCES study_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL, -- text, system
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_chat_messages_conv_created ON chat_messages(conversation_id, created_at);

-- ==========================================
-- 7. OPS
-- ==========================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- match_request, match_accepted, request_expired, chat_expiring, session_reminder
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at);

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);
