package domain

import "time"

// GoogleIntegration represents linked OAuth/iCal calendar credentials
type GoogleIntegration struct {
	UserID       string    `json:"user_id"`
	GoogleEmail  string    `json:"google_email"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	Expiry       time.Time `json:"expiry"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
