package domain

import "time"

type HabitLogStatus string

const (
	StatusSubstituted HabitLogStatus = "substituted" // Successfully executed replacement habit
	StatusRelapsed    HabitLogStatus = "relapsed"    // Fell back to bad habit
	StatusSkipped     HabitLogStatus = "skipped"     // Cue did not occur / skipped
)

type HabitLog struct {
	ID       string         `json:"id"`
	HabitID  string         `json:"habit_id"`
	UserID   string         `json:"user_id"`
	Status   HabitLogStatus `json:"status"`
	Notes    string         `json:"notes,omitempty"`
	LoggedAt time.Time      `json:"logged_at"`
}

type LogOccurrenceDTO struct {
	HabitID string         `json:"habit_id"`
	UserID  string         `json:"user_id"`
	Status  HabitLogStatus `json:"status"`
	Notes   string         `json:"notes"`
}
