package postgres

import (
	"context"
	"database/sql"
	"sync"
	"time"

	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/analytics-service/internal/domain"
)

type AnalyticsRepository interface {
	GetStreakByHabitID(ctx context.Context, habitID string) (*domain.HabitStreak, error)
	GetStreaksByUserID(ctx context.Context, userID string) ([]*domain.HabitStreak, error)
	GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error)
	UpdateUserEconomy(ctx context.Context, economy *domain.UserEconomy) error
}

type PostgresAnalyticsRepository struct {
	db      *sql.DB
	mu      sync.RWMutex
	streaks map[string]*domain.HabitStreak
	economy map[string]*domain.UserEconomy
}

func NewAnalyticsRepository(db *sql.DB) AnalyticsRepository {
	repo := &PostgresAnalyticsRepository{
		db:      db,
		streaks: make(map[string]*domain.HabitStreak),
		economy: make(map[string]*domain.UserEconomy),
	}

	// Seed initial demo data in memory
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
		StreakFreezesAvailable:    2, // Default 2 initial free freezes
		TotalScreenTimeEarnedMins: 60,
		LastUpdated:               time.Now(),
	}

	// If DB connected, seed demo economy if not exists
	if db != nil {
		_, _ = db.Exec(`
			INSERT INTO user_economy (user_id, currency_balance, streak_freezes_available, total_screen_time_earned_mins, last_updated)
			VALUES ('usr_demo', 150, 2, 60, CURRENT_TIMESTAMP)
			ON CONFLICT (user_id) DO NOTHING;
		`)
	}

	return repo
}

func (r *PostgresAnalyticsRepository) GetStreakByHabitID(ctx context.Context, habitID string) (*domain.HabitStreak, error) {
	if r.db != nil {
		query := `SELECT id, habit_id, user_id, current_streak, longest_streak, total_substitutions, total_relapses, last_updated FROM habit_streaks WHERE habit_id = $1`
		row := r.db.QueryRowContext(ctx, query, habitID)

		var s domain.HabitStreak
		if err := row.Scan(&s.ID, &s.HabitID, &s.UserID, &s.CurrentStreak, &s.LongestStreak, &s.TotalSubstitutions, &s.TotalRelapses, &s.LastUpdated); err == nil {
			total := s.TotalSubstitutions + s.TotalRelapses
			if total > 0 {
				s.SuccessRate = (float64(s.TotalSubstitutions) / float64(total)) * 100.0
			}
			return &s, nil
		}
	}

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

func (r *PostgresAnalyticsRepository) GetStreaksByUserID(ctx context.Context, userID string) ([]*domain.HabitStreak, error) {
	if r.db != nil {
		query := `SELECT id, habit_id, user_id, current_streak, longest_streak, total_substitutions, total_relapses, last_updated FROM habit_streaks WHERE user_id = $1`
		rows, err := r.db.QueryContext(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []*domain.HabitStreak
			for rows.Next() {
				var s domain.HabitStreak
				if err := rows.Scan(&s.ID, &s.HabitID, &s.UserID, &s.CurrentStreak, &s.LongestStreak, &s.TotalSubstitutions, &s.TotalRelapses, &s.LastUpdated); err == nil {
					total := s.TotalSubstitutions + s.TotalRelapses
					if total > 0 {
						s.SuccessRate = (float64(s.TotalSubstitutions) / float64(total)) * 100.0
					}
					list = append(list, &s)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*domain.HabitStreak
	for _, s := range r.streaks {
		if s.UserID == userID || userID == "usr_demo" || s.UserID == "usr_demo" {
			result = append(result, s)
		}
	}
	return result, nil
}

func (r *PostgresAnalyticsRepository) GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error) {
	if r.db != nil {
		query := `SELECT user_id, currency_balance, streak_freezes_available, total_screen_time_earned_mins, last_updated FROM user_economy WHERE user_id = $1`
		row := r.db.QueryRowContext(ctx, query, userID)

		var eco domain.UserEconomy
		if err := row.Scan(&eco.UserID, &eco.CurrencyBalance, &eco.StreakFreezesAvailable, &eco.TotalScreenTimeEarnedMins, &eco.LastUpdated); err == nil {
			return &eco, nil
		}

		// Insert initial record if missing
		initEco := &domain.UserEconomy{
			UserID:                    userID,
			CurrencyBalance:           150,
			StreakFreezesAvailable:    2,
			TotalScreenTimeEarnedMins: 0,
			LastUpdated:               time.Now(),
		}
		_, _ = r.db.ExecContext(ctx, `
			INSERT INTO user_economy (user_id, currency_balance, streak_freezes_available, total_screen_time_earned_mins, last_updated)
			VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id) DO NOTHING
		`, initEco.UserID, initEco.CurrencyBalance, initEco.StreakFreezesAvailable, initEco.TotalScreenTimeEarnedMins, initEco.LastUpdated)
		return initEco, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	eco, exists := r.economy[userID]
	if !exists {
		eco = &domain.UserEconomy{
			UserID:                    userID,
			CurrencyBalance:           150,
			StreakFreezesAvailable:    2,
			TotalScreenTimeEarnedMins: 0,
			LastUpdated:               time.Now(),
		}
		r.economy[userID] = eco
	}
	return eco, nil
}

func (r *PostgresAnalyticsRepository) UpdateUserEconomy(ctx context.Context, economy *domain.UserEconomy) error {
	economy.LastUpdated = time.Now()

	if r.db != nil {
		query := `
			INSERT INTO user_economy (user_id, currency_balance, streak_freezes_available, total_screen_time_earned_mins, last_updated)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (user_id) DO UPDATE SET
				currency_balance = EXCLUDED.currency_balance,
				streak_freezes_available = EXCLUDED.streak_freezes_available,
				total_screen_time_earned_mins = EXCLUDED.total_screen_time_earned_mins,
				last_updated = EXCLUDED.last_updated
		`
		_, _ = r.db.ExecContext(ctx, query,
			economy.UserID, economy.CurrencyBalance, economy.StreakFreezesAvailable,
			economy.TotalScreenTimeEarnedMins, economy.LastUpdated,
		)
		// Record transaction
		_, _ = r.db.ExecContext(ctx, `
			INSERT INTO economy_transactions (id, user_id, amount, type, description, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.NewString(), economy.UserID, economy.CurrencyBalance, "update", "Balance updated", time.Now())
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.economy[economy.UserID] = economy
	return nil
}
