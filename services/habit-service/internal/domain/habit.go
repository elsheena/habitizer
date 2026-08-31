package domain

import "time"

// Habit represents the core habit substitution entity
type Habit struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	BadHabit         string    `json:"bad_habit"`          // e.g. "Late night junk food"
	Frequency        string    `json:"frequency"`          // e.g. "daily", "twice_weekly", "weekly"
	ScheduledTime    string    `json:"scheduled_time"`     // e.g. "23:00", "08:00"
	CueTrigger       string    `json:"cue_trigger"`        // e.g. "Stress or boredom at 11 PM"
	ReplacementHabit string    `json:"replacement_habit"`  // Optional
	Reward           string    `json:"reward"`             // Optional
	Category         string    `json:"category"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateHabitDTO defines the payload required to construct a new Habit
type CreateHabitDTO struct {
	UserID           string `json:"user_id"`
	UserTier         string `json:"user_tier"` // "free" or "premium"
	BadHabit         string `json:"bad_habit"`
	Frequency        string `json:"frequency"`
	ScheduledTime    string `json:"scheduled_time"`
	CueTrigger       string `json:"cue_trigger"`
	ReplacementHabit string `json:"replacement_habit"`
	Reward           string `json:"reward"`
	Category         string `json:"category"`
}

// UpdateHabitTimeDTO contains data needed to reschedule a habit
type UpdateHabitTimeDTO struct {
	HabitID       string `json:"habit_id"`
	ScheduledTime string `json:"scheduled_time"`
}
