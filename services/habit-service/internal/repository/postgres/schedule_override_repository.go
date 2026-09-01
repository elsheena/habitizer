package postgres

import (
	"context"
	"database/sql"
	"sync"
	"time"

	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/habit-service/internal/domain"
)

type ScheduleOverrideRepository interface {
	SaveOverride(ctx context.Context, override *domain.HabitScheduleOverride) error
	GetOverridesByHabitID(ctx context.Context, habitID string) ([]*domain.HabitScheduleOverride, error)
	GetOverridesByUserID(ctx context.Context, userID string) ([]*domain.HabitScheduleOverride, error)
	ClearOverridesForHabit(ctx context.Context, habitID string) error
	GetEffectiveTime(ctx context.Context, habitID, dateKey, baseTime string) (string, bool, string, error)
}

type PostgresScheduleOverrideRepository struct {
	db        *sql.DB
	mu        sync.RWMutex
	overrides map[string][]*domain.HabitScheduleOverride
}

func NewScheduleOverrideRepository(db *sql.DB) ScheduleOverrideRepository {
	return &PostgresScheduleOverrideRepository{
		db:        db,
		overrides: make(map[string][]*domain.HabitScheduleOverride),
	}
}

func (r *PostgresScheduleOverrideRepository) SaveOverride(ctx context.Context, override *domain.HabitScheduleOverride) error {
	if override.ID == "" {
		override.ID = "ovr_" + uuid.NewString()
	}
	if override.CreatedAt.IsZero() {
		override.CreatedAt = time.Now()
	}
	override.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	if override.Scope == domain.ScopeAll {
		delete(r.overrides, override.HabitID)
		if r.db != nil {
			_, _ = r.db.ExecContext(ctx, `DELETE FROM habit_schedule_overrides WHERE habit_id = $1`, override.HabitID)
		}
		return nil
	}

	if override.Scope == domain.ScopeFuture {
		var filtered []*domain.HabitScheduleOverride
		for _, existing := range r.overrides[override.HabitID] {
			if existing.TargetDate < override.TargetDate {
				filtered = append(filtered, existing)
			}
		}
		filtered = append(filtered, override)
		r.overrides[override.HabitID] = filtered

		if r.db != nil {
			_, _ = r.db.ExecContext(ctx, `DELETE FROM habit_schedule_overrides WHERE habit_id = $1 AND target_date >= $2`, override.HabitID, override.TargetDate)
			query := `INSERT INTO habit_schedule_overrides (id, habit_id, user_id, scope, target_date, new_scheduled_time, prev_scheduled_time, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
			_, _ = r.db.ExecContext(ctx, query, override.ID, override.HabitID, override.UserID, string(override.Scope), override.TargetDate, override.NewScheduledTime, override.PrevScheduledTime, override.CreatedAt, override.UpdatedAt)
		}
		return nil
	}

	// Single scope
	list := r.overrides[override.HabitID]
	replaced := false
	for i, existing := range list {
		if existing.TargetDate == override.TargetDate && existing.Scope == override.Scope {
			list[i] = override
			replaced = true
			break
		}
	}
	if !replaced {
		r.overrides[override.HabitID] = append(list, override)
	}

	if r.db != nil {
		query := `INSERT INTO habit_schedule_overrides (id, habit_id, user_id, scope, target_date, new_scheduled_time, prev_scheduled_time, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO UPDATE SET new_scheduled_time = EXCLUDED.new_scheduled_time, updated_at = EXCLUDED.updated_at`
		_, _ = r.db.ExecContext(ctx, query, override.ID, override.HabitID, override.UserID, string(override.Scope), override.TargetDate, override.NewScheduledTime, override.PrevScheduledTime, override.CreatedAt, override.UpdatedAt)
	}
	return nil
}

func (r *PostgresScheduleOverrideRepository) GetOverridesByHabitID(ctx context.Context, habitID string) ([]*domain.HabitScheduleOverride, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if r.db != nil {
		query := `SELECT id, habit_id, user_id, scope, target_date, new_scheduled_time, prev_scheduled_time, created_at, updated_at FROM habit_schedule_overrides WHERE habit_id = $1 ORDER BY target_date ASC`
		rows, err := r.db.QueryContext(ctx, query, habitID)
		if err == nil {
			defer rows.Close()
			var results []*domain.HabitScheduleOverride
			for rows.Next() {
				var o domain.HabitScheduleOverride
				var sc string
				if err := rows.Scan(&o.ID, &o.HabitID, &o.UserID, &sc, &o.TargetDate, &o.NewScheduledTime, &o.PrevScheduledTime, &o.CreatedAt, &o.UpdatedAt); err == nil {
					o.Scope = domain.ScheduleScope(sc)
					results = append(results, &o)
				}
			}
			if len(results) > 0 {
				return results, nil
			}
		}
	}
	return r.overrides[habitID], nil
}

func (r *PostgresScheduleOverrideRepository) GetOverridesByUserID(ctx context.Context, userID string) ([]*domain.HabitScheduleOverride, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var all []*domain.HabitScheduleOverride
	for _, list := range r.overrides {
		for _, o := range list {
			if o.UserID == userID {
				all = append(all, o)
			}
		}
	}
	return all, nil
}

func (r *PostgresScheduleOverrideRepository) ClearOverridesForHabit(ctx context.Context, habitID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.overrides, habitID)
	if r.db != nil {
		_, _ = r.db.ExecContext(ctx, `DELETE FROM habit_schedule_overrides WHERE habit_id = $1`, habitID)
	}
	return nil
}

func (r *PostgresScheduleOverrideRepository) GetEffectiveTime(ctx context.Context, habitID, dateKey, baseTime string) (string, bool, string, error) {
	overrides, err := r.GetOverridesByHabitID(ctx, habitID)
	if err != nil || len(overrides) == 0 {
		return baseTime, false, "base", nil
	}

	for _, o := range overrides {
		if o.Scope == domain.ScopeSingle && o.TargetDate == dateKey {
			return o.NewScheduledTime, true, "single", nil
		}
	}

	var latestFuture *domain.HabitScheduleOverride
	for _, o := range overrides {
		if o.Scope == domain.ScopeFuture && o.TargetDate <= dateKey {
			if latestFuture == nil || o.TargetDate > latestFuture.TargetDate {
				latestFuture = o
			}
		}
	}

	if latestFuture != nil {
		return latestFuture.NewScheduledTime, true, "future", nil
	}
	return baseTime, false, "base", nil
}
