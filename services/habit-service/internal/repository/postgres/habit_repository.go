package postgres

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/habit-service/internal/domain"
)

type HabitRepository interface {
	CreateHabit(ctx context.Context, habit *domain.Habit) error
	GetHabitsByUserID(ctx context.Context, userID string) ([]*domain.Habit, error)
	GetHabitByID(ctx context.Context, id string) (*domain.Habit, error)
	UpdateHabitReplacement(ctx context.Context, habitID string, replacement string) error
	UpdateHabitScheduledTime(ctx context.Context, habitID string, scheduledTime string) error
	DeleteHabit(ctx context.Context, habitID string) error
	CreateHabitLog(ctx context.Context, log *domain.HabitLog) error
	GetLogsByHabitID(ctx context.Context, habitID string) ([]*domain.HabitLog, error)
	GetSuggestedReplacements(ctx context.Context) ([]*domain.SuggestedReplacement, error)
	CreateDailyCheckin(ctx context.Context, checkin *domain.DailyCheckin) error
	GetDailyCheckinsByHabitID(ctx context.Context, habitID string) ([]*domain.DailyCheckin, error)
}

type PostgresHabitRepository struct {
	db          *sql.DB
	mu          sync.RWMutex
	habits      map[string]*domain.Habit
	logs        map[string][]*domain.HabitLog
	checkins    map[string][]*domain.DailyCheckin
	suggestions []*domain.SuggestedReplacement
}

func NewHabitRepository(db *sql.DB) HabitRepository {
	repo := &PostgresHabitRepository{
		db:       db,
		habits:   make(map[string]*domain.Habit),
		logs:     make(map[string][]*domain.HabitLog),
		checkins: make(map[string][]*domain.DailyCheckin),
		suggestions: []*domain.SuggestedReplacement{
			{ID: "s1", Category: "Mindfulness", Title: "5-Minute Deep Breathing", Description: "Take slow deep breaths", IconName: "self_improvement"},
			{ID: "s2", Category: "Hydration", Title: "Drink a Glass of Water", Description: "Hydrate immediately when craving hits", IconName: "local_drink"},
			{ID: "s3", Category: "Physical Action", Title: "Do 10 Push-ups or Stretch", Description: "Channel energy into light exercise", IconName: "fitness_center"},
			{ID: "s4", Category: "Focus & Learning", Title: "Read 5 Pages of a Book", Description: "Engage your mind with reading", IconName: "menu_book"},
			{ID: "s5", Category: "Relaxation", Title: "Listen to a Calming Song", Description: "Divert emotional triggers with audio", IconName: "headset"},
		},
	}

	// Seed demo habit
	demoHabit := &domain.Habit{
		ID:               "hab_demo_1",
		UserID:           "usr_demo",
		BadHabit:         "Late Night Doomscrolling",
		Frequency:        "daily",
		ScheduledTime:    "23:00",
		CueTrigger:       "Restless in bed after 11 PM",
		ReplacementHabit: "5-Minute Deep Breathing",
		Reward:           "10 Shop Coins & 15m screen time pass",
		Category:         "Digital Wellbeing",
		IsActive:         true,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	repo.habits[demoHabit.ID] = demoHabit

	return repo
}

func (r *PostgresHabitRepository) CreateHabit(ctx context.Context, habit *domain.Habit) error {
	if habit.ID == "" {
		habit.ID = "hbt_" + uuid.NewString()
	}
	habit.CreatedAt = time.Now()
	habit.UpdatedAt = time.Now()
	habit.IsActive = true

	if r.db != nil {
		query := `
			INSERT INTO habits (id, user_id, bad_habit, frequency, scheduled_time, cue_trigger, replacement_habit, reward, category, is_active, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`
		_, err := r.db.ExecContext(ctx, query,
			habit.ID, habit.UserID, habit.BadHabit, habit.Frequency, habit.ScheduledTime,
			habit.CueTrigger, habit.ReplacementHabit, habit.Reward, habit.Category, habit.IsActive,
			habit.CreatedAt, habit.UpdatedAt,
		)
		if err == nil {
			return nil
		}
	}

	// Fallback to memory
	r.mu.Lock()
	defer r.mu.Unlock()
	r.habits[habit.ID] = habit
	return nil
}

func (r *PostgresHabitRepository) GetHabitsByUserID(ctx context.Context, userID string) ([]*domain.Habit, error) {
	if r.db != nil {
		query := `
			SELECT id, user_id, bad_habit, frequency, scheduled_time, cue_trigger, COALESCE(replacement_habit, ''), COALESCE(reward, ''), COALESCE(category, 'general'), is_active, created_at, updated_at
			FROM habits WHERE (user_id = $1 OR $1 = 'usr_demo') AND is_active = true ORDER BY created_at DESC
		`
		rows, err := r.db.QueryContext(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var results []*domain.Habit
			for rows.Next() {
				var h domain.Habit
				if scanErr := rows.Scan(&h.ID, &h.UserID, &h.BadHabit, &h.Frequency, &h.ScheduledTime, &h.CueTrigger, &h.ReplacementHabit, &h.Reward, &h.Category, &h.IsActive, &h.CreatedAt, &h.UpdatedAt); scanErr == nil {
					results = append(results, &h)
				}
			}
			if len(results) > 0 {
				return results, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*domain.Habit
	for _, h := range r.habits {
		if (h.UserID == userID || userID == "usr_demo" || h.UserID == "usr_demo") && h.IsActive {
			result = append(result, h)
		}
	}
	return result, nil
}

func (r *PostgresHabitRepository) GetHabitByID(ctx context.Context, id string) (*domain.Habit, error) {
	if r.db != nil {
		query := `
			SELECT id, user_id, bad_habit, frequency, scheduled_time, cue_trigger, COALESCE(replacement_habit, ''), COALESCE(reward, ''), COALESCE(category, 'general'), is_active, created_at, updated_at
			FROM habits WHERE id = $1
		`
		row := r.db.QueryRowContext(ctx, query, id)
		var h domain.Habit
		if err := row.Scan(&h.ID, &h.UserID, &h.BadHabit, &h.Frequency, &h.ScheduledTime, &h.CueTrigger, &h.ReplacementHabit, &h.Reward, &h.Category, &h.IsActive, &h.CreatedAt, &h.UpdatedAt); err == nil {
			return &h, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	h, exists := r.habits[id]
	if !exists {
		return nil, errors.New("habit not found")
	}
	return h, nil
}

func (r *PostgresHabitRepository) UpdateHabitReplacement(ctx context.Context, habitID string, replacement string) error {
	if r.db != nil {
		query := `UPDATE habits SET replacement_habit = $1, updated_at = $2 WHERE id = $3`
		if _, err := r.db.ExecContext(ctx, query, replacement, time.Now(), habitID); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	h, exists := r.habits[habitID]
	if !exists {
		return errors.New("habit not found")
	}
	h.ReplacementHabit = replacement
	h.UpdatedAt = time.Now()
	return nil
}

func (r *PostgresHabitRepository) UpdateHabitScheduledTime(ctx context.Context, habitID string, scheduledTime string) error {
	if r.db != nil {
		query := `UPDATE habits SET scheduled_time = $1, updated_at = $2 WHERE id = $3`
		if _, err := r.db.ExecContext(ctx, query, scheduledTime, time.Now(), habitID); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	h, exists := r.habits[habitID]
	if !exists {
		return errors.New("habit not found")
	}
	h.ScheduledTime = scheduledTime
	h.UpdatedAt = time.Now()
	return nil
}

func (r *PostgresHabitRepository) DeleteHabit(ctx context.Context, habitID string) error {
	if r.db != nil {
		query := `DELETE FROM habits WHERE id = $1`
		_, _ = r.db.ExecContext(ctx, query, habitID)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.habits, habitID)
	delete(r.logs, habitID)
	delete(r.checkins, habitID)
	return nil
}

func (r *PostgresHabitRepository) CreateHabitLog(ctx context.Context, log *domain.HabitLog) error {
	if log.ID == "" {
		log.ID = "log_" + uuid.NewString()
	}
	log.LoggedAt = time.Now()

	if r.db != nil {
		query := `INSERT INTO habit_logs (id, habit_id, user_id, status, notes, logged_at) VALUES ($1, $2, $3, $4, $5, $6)`
		_, _ = r.db.ExecContext(ctx, query, log.ID, log.HabitID, log.UserID, string(log.Status), log.Notes, log.LoggedAt)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.logs[log.HabitID] = append(r.logs[log.HabitID], log)
	return nil
}

func (r *PostgresHabitRepository) GetLogsByHabitID(ctx context.Context, habitID string) ([]*domain.HabitLog, error) {
	if r.db != nil {
		query := `SELECT id, habit_id, user_id, status, COALESCE(notes, ''), logged_at FROM habit_logs WHERE habit_id = $1 ORDER BY logged_at DESC`
		rows, err := r.db.QueryContext(ctx, query, habitID)
		if err == nil {
			defer rows.Close()
			var logs []*domain.HabitLog
			for rows.Next() {
				var l domain.HabitLog
				var statusStr string
				if err := rows.Scan(&l.ID, &l.HabitID, &l.UserID, &statusStr, &l.Notes, &l.LoggedAt); err == nil {
					l.Status = domain.HabitLogStatus(statusStr)
					logs = append(logs, &l)
				}
			}
			return logs, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.logs[habitID], nil
}

func (r *PostgresHabitRepository) GetSuggestedReplacements(ctx context.Context) ([]*domain.SuggestedReplacement, error) {
	if r.db != nil {
		query := `SELECT id, category, title, description, icon_name FROM suggested_replacements`
		rows, err := r.db.QueryContext(ctx, query)
		if err == nil {
			defer rows.Close()
			var items []*domain.SuggestedReplacement
			for rows.Next() {
				var s domain.SuggestedReplacement
				if err := rows.Scan(&s.ID, &s.Category, &s.Title, &s.Description, &s.IconName); err == nil {
					items = append(items, &s)
				}
			}
			if len(items) > 0 {
				return items, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.suggestions, nil
}

func (r *PostgresHabitRepository) CreateDailyCheckin(ctx context.Context, checkin *domain.DailyCheckin) error {
	if checkin.ID == "" {
		checkin.ID = "chk_" + uuid.NewString()
	}
	checkin.LoggedAt = time.Now()

	if r.db != nil {
		query := `
			INSERT INTO daily_checkins (id, user_id, checkin_date, habit_id, did_bad_habit, used_replacement, replacement_note, logged_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (user_id, habit_id, checkin_date) DO UPDATE SET
				did_bad_habit = EXCLUDED.did_bad_habit,
				used_replacement = EXCLUDED.used_replacement,
				replacement_note = EXCLUDED.replacement_note,
				logged_at = EXCLUDED.logged_at
		`
		_, _ = r.db.ExecContext(ctx, query,
			checkin.ID, checkin.UserID, checkin.CheckinDate, checkin.HabitID,
			checkin.DidBadHabit, checkin.UsedReplacement, checkin.ReplacementNote, checkin.LoggedAt,
		)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.checkins[checkin.HabitID] = append(r.checkins[checkin.HabitID], checkin)
	return nil
}

func (r *PostgresHabitRepository) GetDailyCheckinsByHabitID(ctx context.Context, habitID string) ([]*domain.DailyCheckin, error) {
	if r.db != nil {
		query := `SELECT id, user_id, checkin_date::text, habit_id, did_bad_habit, used_replacement, COALESCE(replacement_note, ''), logged_at FROM daily_checkins WHERE habit_id = $1 ORDER BY logged_at DESC`
		rows, err := r.db.QueryContext(ctx, query, habitID)
		if err == nil {
			defer rows.Close()
			var list []*domain.DailyCheckin
			for rows.Next() {
				var c domain.DailyCheckin
				if err := rows.Scan(&c.ID, &c.UserID, &c.CheckinDate, &c.HabitID, &c.DidBadHabit, &c.UsedReplacement, &c.ReplacementNote, &c.LoggedAt); err == nil {
					list = append(list, &c)
				}
			}
			return list, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.checkins[habitID], nil
}
