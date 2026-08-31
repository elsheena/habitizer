package domain

import "time"

// HabitStreak encapsulates streak metrics and progress calculation for a single habit
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
