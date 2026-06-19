package postgres

import (
	"context"
	"sync"
	"time"

	"github.com/habitizer/services/analytics-service/internal/domain"
)

type AnalyticsRepository interface {
	GetStreakByHabitID(ctx context.Context, habitID string) (*domain.HabitStreak, error)
	GetStreaksByUserID(ctx context.Context, userID string) ([]*domain.HabitStreak, error)
	GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error)
	UpdateUserEconomy(ctx context.Context, economy *domain.UserEconomy) error
}

type InMemoryAnalyticsRepository struct {
	mu      sync.RWMutex
	streaks map[string]*domain.HabitStreak
	economy map[string]*domain.UserEconomy
}

func NewAnalyticsRepository() AnalyticsRepository {
	repo := &InMemoryAnalyticsRepository{
		streaks: make(map[string]*domain.HabitStreak),
		economy: make(map[string]*domain.UserEconomy),
	}
	// Seed initial demo data
	repo.streaks["hbt_demo"] = &domain.HabitStreak{
		ID:                 "strk_1",
		HabitID:            "hbt_demo",
		UserID:             "usr_demo",
		CurrentStreak:      12,
		LongestStreak:      15,
		TotalSubstitutions: 28,
		TotalRelapses:      2,
		SuccessRate:        93.3,
		LastUpdated:        time.Now(),
	}
	repo.economy["usr_demo"] = &domain.UserEconomy{
		UserID:                    "usr_demo",
		CurrencyBalance:           150,
		StreakFreezesAvailable:   2, // Default 2 initial free freezes
		TotalScreenTimeEarnedMins: 60,
		LastUpdated:               time.Now(),
	}
	return repo
}

func (r *InMemoryAnalyticsRepository) GetStreakByHabitID(ctx context.Context, habitID string) (*domain.HabitStreak, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.streaks[habitID]
	if !exists {
		return &domain.HabitStreak{
			HabitID:       habitID,
			CurrentStreak: 0,
			LongestStreak: 0,
			SuccessRate:   0,
		}, nil
	}
	return s, nil
}

func (r *InMemoryAnalyticsRepository) GetStreaksByUserID(ctx context.Context, userID string) ([]*domain.HabitStreak, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.HabitStreak
	for _, s := range r.streaks {
		if s.UserID == userID {
			result = append(result, s)
		}
	}
	return result, nil
}

func (r *InMemoryAnalyticsRepository) GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	eco, exists := r.economy[userID]
	if !exists {
		eco = &domain.UserEconomy{
			UserID:                    userID,
			CurrencyBalance:           0,
			StreakFreezesAvailable:   2, // Initial 2 free freezes
			TotalScreenTimeEarnedMins: 0,
			LastUpdated:               time.Now(),
		}
		r.economy[userID] = eco
	}
	return eco, nil
}

func (r *InMemoryAnalyticsRepository) UpdateUserEconomy(ctx context.Context, economy *domain.UserEconomy) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	economy.LastUpdated = time.Now()
	r.economy[economy.UserID] = economy
	return nil
}
