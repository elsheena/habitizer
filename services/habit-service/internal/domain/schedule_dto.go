package domain

// RescheduleScopeDTO defines the payload sent by clients to reschedule a habit or recurring series.
type RescheduleScopeDTO struct {
	HabitID       string        `json:"habit_id"`
	UserID        string        `json:"user_id"`
	Scope         ScheduleScope `json:"scope"`           // 'single', 'future', 'all'
	TargetDateKey string        `json:"target_date_key"` // 'YYYY-MM-DD'
	NewTime       string        `json:"new_time"`        // 'HH:MM'
}

// EffectiveScheduleDTO represents the calculated scheduled time for a habit on a specific date.
type EffectiveScheduleDTO struct {
	HabitID          string `json:"habit_id"`
	DateKey          string `json:"date_key"`
	ScheduledTime    string `json:"scheduled_time"`
	IsOverridden     bool   `json:"is_overridden"`
	ScopeApplied     string `json:"scope_applied"`
	ReplacementHabit string `json:"replacement_habit"`
	BadHabit         string `json:"bad_habit"`
	Category         string `json:"category"`
}

// ConflictReportDTO represents a detected time clash between an event and a habit.
type ConflictReportDTO struct {
	HabitID     string `json:"habit_id"`
	HabitTitle  string `json:"habit_title"`
	EventID     string `json:"event_id"`
	EventTitle  string `json:"event_title"`
	ConflictAt  string `json:"conflict_at"`
	EventWindow string `json:"event_window"`
}

// AutoScheduleResultDTO represents the outcome of the backend Smart Scheduler fitting routines into free slots.
type AutoScheduleResultDTO struct {
	TargetDate       string               `json:"target_date"`
	AdjustmentsCount int                  `json:"adjustments_count"`
	Schedules        []*EffectiveScheduleDTO `json:"schedules"`
	Conflicts        []*ConflictReportDTO `json:"conflicts"`
	Message          string               `json:"message"`
}
