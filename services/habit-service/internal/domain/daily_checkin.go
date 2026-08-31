package domain

import "time"

// DailyCheckin represents a 21:00 nightly reflection record for habit adherence
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

// CreateDailyCheckinDTO carries the input payload for submitting a nightly check-in
type CreateDailyCheckinDTO struct {
	UserID          string `json:"user_id"`
	CheckinDate     string `json:"checkin_date"`
	HabitID         string `json:"habit_id"`
	DidBadHabit     bool   `json:"did_bad_habit"`
	UsedReplacement bool   `json:"used_replacement"`
	ReplacementNote string `json:"replacement_note"`
}

// PromoteReplacementDTO encapsulates the promotion of a custom note into an official habit
type PromoteReplacementDTO struct {
	UserID           string `json:"user_id"`
	HabitID          string `json:"habit_id"`
	ReplacementHabit string `json:"replacement_habit"`
}

// DailyCheckinResponse delivers the result and any detected auto-promotion suggestions
type DailyCheckinResponse struct {
	Checkin                *DailyCheckin `json:"checkin"`
	SuggestPromotion       bool          `json:"suggest_promotion"`
	SuggestedReplacement   string        `json:"suggested_replacement,omitempty"`
	PromotionSuggestionMsg string        `json:"promotion_suggestion_msg,omitempty"`
}
