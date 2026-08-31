package domain

// SuggestedReplacement represents an evidence-based healthy routine catalog item
type SuggestedReplacement struct {
	ID          string `json:"id"`
	Category    string `json:"category"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IconName    string `json:"icon_name"`
}
