package domain

// RegisterDTO encapsulates registration credentials and profile data
type RegisterDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// LoginDTO encapsulates sign-in credentials
type LoginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponseDTO returns the authenticated user and their JWT session token
type AuthResponseDTO struct {
	User        User   `json:"user"`
	AccessToken string `json:"access_token"`
}
