-- Habitizer Database Initialization Script

-- 1. Create Microservice Schemas (Segregated Database Contexts)
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS habit_schema;
CREATE SCHEMA IF NOT EXISTS analytics_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTH SERVICE TABLES & GOOGLE INTEGRATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_schema.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    tier VARCHAR(50) DEFAULT 'free', -- 'free' (max 3 habits) or 'premium' (unlimited)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_schema.google_integrations (
    user_id UUID PRIMARY KEY REFERENCES auth_schema.users(id) ON DELETE CASCADE,
    google_email VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HABIT SERVICE TABLES (Habit Substitution Engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS habit_schema.suggested_replacements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_schema.habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    bad_habit VARCHAR(255) NOT NULL,          -- e.g. "Late night junk food snacking"
    frequency VARCHAR(50) DEFAULT 'daily',    -- e.g. "daily", "twice_weekly", "weekly"
    scheduled_time VARCHAR(10) DEFAULT '09:00', -- e.g. "23:00", "08:00"
    cue_trigger VARCHAR(255) NOT NULL,        -- e.g. "Boredom or stress at 11 PM"
    replacement_habit VARCHAR(255),           -- Optional replacement routine
    reward VARCHAR(255),                      -- Optional reward definition
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_schema.habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habit_schema.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,             -- 'substituted' (SUCCESS), 'relapsed' (FAILED), 'skipped'
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_schema.daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    habit_id UUID NOT NULL REFERENCES habit_schema.habits(id) ON DELETE CASCADE,
    did_bad_habit BOOLEAN NOT NULL,
    used_replacement BOOLEAN DEFAULT FALSE,
    replacement_note VARCHAR(255),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, habit_id, checkin_date)
);

-- ============================================================================
-- ANALYTICS & ECONOMY SERVICE TABLES (Streaks, Currency & Rewards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_schema.habit_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    total_substitutions INT DEFAULT 0,
    total_relapses INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_schema.user_economy (
    user_id UUID PRIMARY KEY,
    currency_balance INT DEFAULT 0,
    streak_freezes_available INT DEFAULT 2, -- 2 initial free freezes
    total_screen_time_earned_mins INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Seed Data for Catalog
INSERT INTO habit_schema.suggested_replacements (category, title, description, icon_name) VALUES
('Mindfulness', '5-Minute Deep Breathing', 'Take slow, deep breaths to regulate stress triggers', 'self_improvement'),
('Hydration', 'Drink a Glass of Water', 'Hydrate immediately when experiencing a craving', 'local_drink'),
('Physical Action', 'Do 10 Push-ups or Stretch', 'Channel nervous energy into light physical movement', 'fitness_center'),
('Focus & Learning', 'Read 5 Pages of a Book', 'Divert mental focus to engaging literature', 'menu_book'),
('Relaxation', 'Listen to a Calming Song', 'Replace emotional urges with relaxing audio', 'headset')
ON CONFLICT DO NOTHING;

-- Index optimization
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habit_schema.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_schema.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_schema.habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON habit_schema.daily_checkins(user_id, checkin_date);
