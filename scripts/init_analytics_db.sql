-- ============================================================================
-- HABITIZER ANALYTICS SERVICE DATABASE DDL (habitizer_analytics_db)
-- Independent database for Streaks, User Economy, and Rewards Store
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS habit_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    total_substitutions INT DEFAULT 0,
    total_relapses INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_economy (
    user_id VARCHAR(255) PRIMARY KEY,
    currency_balance INT DEFAULT 0,
    streak_freezes_available INT DEFAULT 2, -- 2 initial free freezes
    total_screen_time_earned_mins INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS economy_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reward', 'purchase', 'initial'
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_user ON habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_economy_transactions_user ON economy_transactions(user_id);
