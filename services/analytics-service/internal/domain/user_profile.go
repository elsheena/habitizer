package domain

// UserProfileSummary aggregates streak performance and economy overview
type UserProfileSummary struct {
	UserID             string       `json:"user_id"`
	TotalStreaks       int          `json:"total_streaks"`
	LongestStreak      int          `json:"longest_streak"`
	OverallSuccessRate float64      `json:"overall_success_rate"`
	Economy            *UserEconomy `json:"economy"`
}
