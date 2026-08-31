package domain

import "time"

// UserEconomy manages the user's earned coins balance, streak freezes, and leisure time
type UserEconomy struct {
	UserID                    string    `json:"user_id"`
	CurrencyBalance           int       `json:"currency_balance"`
	StreakFreezesAvailable    int       `json:"streak_freezes_available"` // Default 2 initial free freezes
	TotalScreenTimeEarnedMins int       `json:"total_screen_time_earned_mins"`
	LastUpdated               time.Time `json:"last_updated"`
}

// BuyStreakFreezeDTO carries input for purchasing streak freezes
type BuyStreakFreezeDTO struct {
	UserID string `json:"user_id"`
}

// RedeemRewardDTO carries input for redeeming leisure passes or treats
type RedeemRewardDTO struct {
	UserID       string `json:"user_id"`
	RewardType   string `json:"reward_type"` // e.g. "screen_time_30m"
	CurrencyCost int    `json:"currency_cost"`
}

// EconomyTransaction records historical coin transactions
type EconomyTransaction struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Amount      int       `json:"amount"`
	Type        string    `json:"type"` // "reward", "purchase", "initial"
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}
