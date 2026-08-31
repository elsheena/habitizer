package domain

import "time"

// ScheduleScope represents the valid reschedule scope types.
type ScheduleScope string

const (
	ScopeSingle ScheduleScope = "single"
	ScopeFuture ScheduleScope = "future"
	ScopeAll    ScheduleScope = "all"
)

// HabitScheduleOverride represents a date-specific or future-series override in the database.
type HabitScheduleOverride struct {
	ID                string        `json:"id"`
	HabitID           string        `json:"habit_id"`
	UserID            string        `json:"user_id"`
	Scope             ScheduleScope `json:"scope"`
	TargetDate        string        `json:"target_date"` // "YYYY-MM-DD"
	NewScheduledTime  string        `json:"new_scheduled_time"`
	PrevScheduledTime string        `json:"prev_scheduled_time"`
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`
}
