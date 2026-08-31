package domain

import "time"

// CalendarEvent represents a scheduled event or meeting on the user's timetable
type CalendarEvent struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Date          string    `json:"date"`       // e.g. "2026-08-28"
	StartTime     string    `json:"start_time"` // e.g. "14:00"
	EndTime       string    `json:"end_time"`   // e.g. "15:00"
	Location      string    `json:"location"`
	Tag           string    `json:"tag"`
	IsGoogleEvent bool      `json:"is_google_event"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// CalendarEventDTO represents the data payload for creating/updating a calendar event
type CalendarEventDTO struct {
	ID            string `json:"id,omitempty"`
	UserID        string `json:"user_id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Date          string `json:"date"`
	StartTime     string `json:"start_time"`
	EndTime       string `json:"end_time"`
	Location      string `json:"location"`
	Tag           string `json:"tag"`
	IsGoogleEvent bool   `json:"is_google_event"`
}

// AutoScheduleDTO delivers calendar context for smart habit placement
type AutoScheduleDTO struct {
	UserID string             `json:"user_id"`
	Date   string             `json:"date"`
	Events []CalendarEventDTO `json:"events"`
}

// AutoScheduleResponseDTO reports auto-fitted habit adjustments
type AutoScheduleResponseDTO struct {
	Habits           []*Habit `json:"habits"`
	AdjustmentsCount int      `json:"adjustments_count"`
	Message          string   `json:"message"`
}
