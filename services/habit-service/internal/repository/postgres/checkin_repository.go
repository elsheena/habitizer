package postgres

import (
	"context"
	"time"

	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/habit-service/internal/domain"
)

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
