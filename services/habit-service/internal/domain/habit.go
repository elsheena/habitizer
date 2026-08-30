package domain

import "time"

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

type SuggestedReplacement struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
}

type DailyCheckin struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	CheckinDate     string    `json:"checkin_date"`
	HabitID         string    `json:"habit_id"`
	DidBadHabit     bool      `json:"did_bad_habit"`
	UsedReplacement bool      `json:"used_replacement"`
	ReplacementNote string    `json:"replacement_note"`
	LoggedAt        time.Time `json:"logged_at"`
}

type CreateDailyCheckinDTO struct {
	UserID          string `json:"user_id"`
	CheckinDate     string `json:"checkin_date"`
	HabitID         string `json:"habit_id"`
	DidBadHabit     bool   `json:"did_bad_habit"`
	UsedReplacement bool   `json:"used_replacement"`
	ReplacementNote string `json:"replacement_note"`
}

type PromoteReplacementDTO struct {
	UserID           string `json:"user_id"`
	HabitID          string `json:"habit_id"`
	ReplacementHabit string `json:"replacement_habit"`
}

type DailyCheckinResponse struct {
	Checkin                *DailyCheckin `json:"checkin"`
	SuggestPromotion       bool          `json:"suggest_promotion"`
	SuggestedReplacement   string        `json:"suggested_replacement,omitempty"`
	PromotionSuggestionMsg string        `json:"promotion_suggestion_msg,omitempty"`
}

type CalendarEventDTO struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Date        string `json:"date"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Location    string `json:"location"`
	Description string `json:"description"`
}

type AutoScheduleDTO struct {
	UserID string             `json:"user_id"`
	Date   string             `json:"date"`
	Events []CalendarEventDTO `json:"events"`
}

type UpdateHabitTimeDTO struct {
	HabitID       string `json:"habit_id"`
	ScheduledTime string `json:"scheduled_time"`
}

type AutoScheduleResponseDTO struct {
	Habits           []*Habit `json:"habits"`
	AdjustmentsCount int      `json:"adjustments_count"`
	Message          string   `json:"message"`
}
