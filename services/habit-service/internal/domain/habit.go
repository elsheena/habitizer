package domain

import "time"

// Habit represents the core habit substitution entity
type Habit struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"user_id"`
	BadHabit             string    `json:"bad_habit"`
	Frequency            string    `json:"frequency"`
	ScheduledTime        string    `json:"scheduled_time"`
	CueTrigger           string    `json:"cue_trigger"`
	ReplacementHabit     string    `json:"replacement_habit"`
	Reward               string    `json:"reward"`
	Category             string    `json:"category"`
	PreferredWindowStart string    `json:"preferred_window_start"` // e.g. "06:00"
	PreferredWindowEnd   string    `json:"preferred_window_end"`   // e.g. "10:00"
	IsActive             bool      `json:"is_active"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// CreateHabitDTO defines the payload required to construct a new Habit
type CreateHabitDTO struct {
	UserID               string `json:"user_id"`
	UserTier             string `json:"user_tier"`
	BadHabit             string `json:"bad_habit"`
	Frequency            string `json:"frequency"`
	ScheduledTime        string `json:"scheduled_time"`
	CueTrigger           string `json:"cue_trigger"`
	ReplacementHabit     string `json:"replacement_habit"`
	Reward               string `json:"reward"`
	Category             string `json:"category"`
	PreferredWindowStart string `json:"preferred_window_start"`
	PreferredWindowEnd   string `json:"preferred_window_end"`
}

// UpdateHabitTimeDTO contains data needed to reschedule a habit
type UpdateHabitTimeDTO struct {
	HabitID       string `json:"habit_id"`
	ScheduledTime string `json:"scheduled_time"`
}
