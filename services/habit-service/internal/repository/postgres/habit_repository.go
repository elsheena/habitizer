package postgres

import (
	"context"
	"errors"
	"sync"
	"time"

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

type InMemoryHabitRepository struct {
	mu           sync.RWMutex
	habits       map[string]*domain.Habit
	logs         map[string][]*domain.HabitLog
	checkins     map[string][]*domain.DailyCheckin
	suggestions []*domain.SuggestedReplacement
}

func NewHabitRepository() HabitRepository {
	return &InMemoryHabitRepository{
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
}

func (r *InMemoryHabitRepository) CreateHabit(ctx context.Context, habit *domain.Habit) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	habit.CreatedAt = time.Now()
	habit.UpdatedAt = time.Now()
	r.habits[habit.ID] = habit
	return nil
}

func (r *InMemoryHabitRepository) GetHabitsByUserID(ctx context.Context, userID string) ([]*domain.Habit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*domain.Habit
	for _, h := range r.habits {
		if h.UserID == userID {
			result = append(result, h)
		}
	}
	return result, nil
}

func (r *InMemoryHabitRepository) GetHabitByID(ctx context.Context, id string) (*domain.Habit, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	h, exists := r.habits[id]
	if !exists {
		return nil, errors.New("habit not found")
	}
	return h, nil
}

func (r *InMemoryHabitRepository) UpdateHabitReplacement(ctx context.Context, habitID string, replacement string) error {
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

func (r *InMemoryHabitRepository) UpdateHabitScheduledTime(ctx context.Context, habitID string, scheduledTime string) error {
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

func (r *InMemoryHabitRepository) DeleteHabit(ctx context.Context, habitID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.habits[habitID]; !exists {
		return errors.New("habit not found")
	}
	delete(r.habits, habitID)
	delete(r.logs, habitID)
	delete(r.checkins, habitID)
	return nil
}

func (r *InMemoryHabitRepository) CreateHabitLog(ctx context.Context, log *domain.HabitLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	log.LoggedAt = time.Now()
	r.logs[log.HabitID] = append(r.logs[log.HabitID], log)
	return nil
}

func (r *InMemoryHabitRepository) GetLogsByHabitID(ctx context.Context, habitID string) ([]*domain.HabitLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.logs[habitID], nil
}

func (r *InMemoryHabitRepository) GetSuggestedReplacements(ctx context.Context) ([]*domain.SuggestedReplacement, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.suggestions, nil
}

func (r *InMemoryHabitRepository) CreateDailyCheckin(ctx context.Context, checkin *domain.DailyCheckin) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	checkin.LoggedAt = time.Now()
	r.checkins[checkin.HabitID] = append(r.checkins[checkin.HabitID], checkin)
	return nil
}

func (r *InMemoryHabitRepository) GetDailyCheckinsByHabitID(ctx context.Context, habitID string) ([]*domain.DailyCheckin, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return r.checkins[habitID], nil
}
