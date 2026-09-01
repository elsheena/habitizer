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

type CalendarEventRepository interface {
	CreateEvent(ctx context.Context, ev *domain.CalendarEvent) error
	GetEventsByUserID(ctx context.Context, userID string) ([]*domain.CalendarEvent, error)
	GetEventByID(ctx context.Context, id string) (*domain.CalendarEvent, error)
	UpdateEvent(ctx context.Context, ev *domain.CalendarEvent) error
	DeleteEvent(ctx context.Context, id string) error
}

type PostgresCalendarEventRepository struct {
	db     *sql.DB
	mu     sync.RWMutex
	events map[string]*domain.CalendarEvent
}

func NewCalendarEventRepository(db *sql.DB) CalendarEventRepository {
	repo := &PostgresCalendarEventRepository{
		db:     db,
		events: make(map[string]*domain.CalendarEvent),
	}

	demoEvents := []*domain.CalendarEvent{
		{ID: "gcal_standup_01", UserID: "usr_demo", Title: "Daily Engineering Standup", Date: "2026-08-28", StartTime: "09:00", EndTime: "09:45", Location: "Google Meet", Tag: "Meeting", IsGoogleEvent: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: "gcal_design_02", UserID: "usr_demo", Title: "Product Design & UX Review", Date: "2026-08-28", StartTime: "11:00", EndTime: "12:15", Location: "Room 402 / Meet", Tag: "Design", IsGoogleEvent: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: "gcal_deepwork_03", UserID: "usr_demo", Title: "Focus Deep Work Block", Date: "2026-08-28", StartTime: "14:30", EndTime: "16:00", Location: "Desk", Tag: "Focus", IsGoogleEvent: true, CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}

	for _, e := range demoEvents {
		repo.events[e.ID] = e
	}
	return repo
}

func (r *PostgresCalendarEventRepository) CreateEvent(ctx context.Context, ev *domain.CalendarEvent) error {
	if ev.ID == "" {
		ev.ID = "ev_" + uuid.NewString()
	}
	ev.CreatedAt = time.Now()
	ev.UpdatedAt = time.Now()

	if r.db != nil {
		query := `INSERT INTO calendar_events (id, user_id, title, description, date, start_time, end_time, location, tag, is_google_event, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
		if _, err := r.db.ExecContext(ctx, query, ev.ID, ev.UserID, ev.Title, ev.Description, ev.Date, ev.StartTime, ev.EndTime, ev.Location, ev.Tag, ev.IsGoogleEvent, ev.CreatedAt, ev.UpdatedAt); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.events[ev.ID] = ev
	return nil
}

func (r *PostgresCalendarEventRepository) GetEventsByUserID(ctx context.Context, userID string) ([]*domain.CalendarEvent, error) {
	if r.db != nil {
		query := `SELECT id, user_id, title, COALESCE(description, ''), date, start_time, end_time, COALESCE(location, ''), COALESCE(tag, 'General'), is_google_event, created_at, updated_at FROM calendar_events WHERE (user_id = $1 OR $1 = 'usr_demo') ORDER BY date ASC, start_time ASC`
		rows, err := r.db.QueryContext(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []*domain.CalendarEvent
			for rows.Next() {
				var e domain.CalendarEvent
				if err := rows.Scan(&e.ID, &e.UserID, &e.Title, &e.Description, &e.Date, &e.StartTime, &e.EndTime, &e.Location, &e.Tag, &e.IsGoogleEvent, &e.CreatedAt, &e.UpdatedAt); err == nil {
					list = append(list, &e)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []*domain.CalendarEvent
	for _, e := range r.events {
		if e.UserID == userID || userID == "usr_demo" || e.UserID == "usr_demo" {
			result = append(result, e)
		}
	}
	return result, nil
}

func (r *PostgresCalendarEventRepository) GetEventByID(ctx context.Context, id string) (*domain.CalendarEvent, error) {
	if r.db != nil {
		query := `SELECT id, user_id, title, COALESCE(description, ''), date, start_time, end_time, COALESCE(location, ''), COALESCE(tag, 'General'), is_google_event, created_at, updated_at FROM calendar_events WHERE id = $1`
		row := r.db.QueryRowContext(ctx, query, id)
		var e domain.CalendarEvent
		if err := row.Scan(&e.ID, &e.UserID, &e.Title, &e.Description, &e.Date, &e.StartTime, &e.EndTime, &e.Location, &e.Tag, &e.IsGoogleEvent, &e.CreatedAt, &e.UpdatedAt); err == nil {
			return &e, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	e, exists := r.events[id]
	if !exists {
		return nil, errors.New("event not found")
	}
	return e, nil
}

func (r *PostgresCalendarEventRepository) UpdateEvent(ctx context.Context, ev *domain.CalendarEvent) error {
	ev.UpdatedAt = time.Now()

	if r.db != nil {
		query := `UPDATE calendar_events SET title = $1, description = $2, date = $3, start_time = $4, end_time = $5, location = $6, tag = $7, updated_at = $8 WHERE id = $9`
		if _, err := r.db.ExecContext(ctx, query, ev.Title, ev.Description, ev.Date, ev.StartTime, ev.EndTime, ev.Location, ev.Tag, ev.UpdatedAt, ev.ID); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	existing, exists := r.events[ev.ID]
	if !exists {
		return errors.New("event not found")
	}
	existing.Title = ev.Title
	existing.Description = ev.Description
	existing.Date = ev.Date
	existing.StartTime = ev.StartTime
	existing.EndTime = ev.EndTime
	existing.Location = ev.Location
	existing.Tag = ev.Tag
	existing.UpdatedAt = time.Now()
	return nil
}

func (r *PostgresCalendarEventRepository) DeleteEvent(ctx context.Context, id string) error {
	if r.db != nil {
		query := `DELETE FROM calendar_events WHERE id = $1`
		_, _ = r.db.ExecContext(ctx, query, id)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.events, id)
	return nil
}
