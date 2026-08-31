-- ============================================================================
-- HABITIZER HABIT SERVICE DATABASE DDL (habitizer_habit_db)
-- Independent database for Habits, Routine Catalogs, Check-ins, and Calendar Events
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS suggested_replacements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    bad_habit VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily',
    scheduled_time VARCHAR(10) DEFAULT '09:00',
    cue_trigger VARCHAR(255) NOT NULL,
    replacement_habit VARCHAR(255),
    reward VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    did_bad_habit BOOLEAN NOT NULL,
    used_replacement BOOLEAN DEFAULT FALSE,
    replacement_note VARCHAR(255),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, habit_id, checkin_date)
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    location VARCHAR(255),
    tag VARCHAR(50) DEFAULT 'General',
    is_google_event BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_schedule_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    scope VARCHAR(20) NOT NULL, -- 'single', 'future', 'all'
    target_date VARCHAR(20) NOT NULL, -- 'YYYY-MM-DD'
    new_scheduled_time VARCHAR(10) NOT NULL,
    prev_scheduled_time VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data for Replacement Routines
INSERT INTO suggested_replacements (category, title, description, icon_name) VALUES
('Mindfulness', '5-Minute Deep Breathing', 'Take slow, deep breaths to regulate stress triggers', 'self_improvement'),
('Hydration', 'Drink a Glass of Water', 'Hydrate immediately when experiencing a craving', 'local_drink'),
('Physical Action', 'Do 10 Push-ups or Stretch', 'Channel nervous energy into light physical movement', 'fitness_center'),
('Focus & Learning', 'Read 5 Pages of a Book', 'Divert mental focus to engaging literature', 'menu_book'),
('Relaxation', 'Listen to a Calming Song', 'Replace emotional urges with relaxing audio', 'headset')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id, checkin_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_overrides_habit ON habit_schedule_overrides(habit_id, target_date);
CREATE INDEX IF NOT EXISTS idx_habit_overrides_user ON habit_schedule_overrides(user_id);
