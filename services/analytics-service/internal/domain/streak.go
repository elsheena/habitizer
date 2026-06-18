package domain

import "time"

type HabitStreak struct {
	ID                 string    `json:"id"`
	HabitID            string    `json:"habit_id"`
	UserID             string    `json:"user_id"`
	CurrentStreak      int       `json:"current_streak"`
	LongestStreak      int       `json:"longest_streak"`
	TotalSubstitutions int       `json:"total_substitutions"`
	TotalRelapses      int       `json:"total_relapses"`
	SuccessRate        float64   `json:"success_rate"` // % calculated field
	LastUpdated        time.Time `json:"last_updated"`
}

type UserEconomy struct {
	UserID                   string    `json:"user_id"`
	CurrencyBalance          int       `json:"currency_balance"`
	StreakFreezesAvailable   int       `json:"streak_freezes_available"` // Default 2 initial free freezes
	TotalScreenTimeEarnedMins int       `json:"total_screen_time_earned_mins"`
	LastUpdated              time.Time `json:"last_updated"`
}

type BuyStreakFreezeDTO struct {
	UserID string `json:"user_id"`
}

type RedeemRewardDTO struct {
	UserID        string `json:"user_id"`
	RewardType    string `json:"reward_type"` // e.g. "screen_time_30m"
	CurrencyCost  int    `json:"currency_cost"`
}

type UserProfileSummary struct {
	UserID            string       `json:"user_id"`
	TotalStreaks      int          `json:"total_streaks"`
	LongestStreak     int          `json:"longest_streak"`
	OverallSuccessRate float64     `json:"overall_success_rate"`
	Economy           *UserEconomy `json:"economy"`
}
