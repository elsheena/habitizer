package usecase

import (
	"context"
	"time"

	pkgErrors "github.com/habitizer/pkg/errors"
	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/repository/postgres"
)

// ScheduleOverrideUsecase defines operations for recurring schedule scope overrides and daily timetable calculation.
type ScheduleOverrideUsecase interface {
	ApplyScheduleScope(ctx context.Context, dto domain.RescheduleScopeDTO) (*domain.HabitScheduleOverride, error)
	GetEffectiveSchedule(ctx context.Context, userID, dateKey string) ([]*domain.EffectiveScheduleDTO, error)
}

type scheduleOverrideUsecase struct {
	habitRepo    postgres.HabitRepository
	overrideRepo postgres.ScheduleOverrideRepository
}

func NewScheduleOverrideUsecase(habitRepo postgres.HabitRepository, overrideRepo postgres.ScheduleOverrideRepository) ScheduleOverrideUsecase {
	return &scheduleOverrideUsecase{
		habitRepo:    habitRepo,
		overrideRepo: overrideRepo,
	}
}

// ApplyScheduleScope implements 3-point scope calculations: 'single', 'future', 'all'
func (u *scheduleOverrideUsecase) ApplyScheduleScope(ctx context.Context, dto domain.RescheduleScopeDTO) (*domain.HabitScheduleOverride, error) {
	if dto.HabitID == "" || dto.NewTime == "" {
		return nil, pkgErrors.ErrInvalidInput
	}

	habit, err := u.habitRepo.GetHabitByID(ctx, dto.HabitID)
	if err != nil {
		return nil, pkgErrors.ErrHabitNotFound
	}

	if dto.Scope == domain.ScopeAll {
		// Update base habit scheduled time and clear past date overrides
		_ = u.habitRepo.UpdateHabitScheduledTime(ctx, habit.ID, dto.NewTime)
		_ = u.overrideRepo.ClearOverridesForHabit(ctx, habit.ID)
		habit.ScheduledTime = dto.NewTime
		return &domain.HabitScheduleOverride{
			ID:                "ovr_" + uuid.NewString(),
			HabitID:           habit.ID,
			UserID:            habit.UserID,
			Scope:             domain.ScopeAll,
			TargetDate:        dto.TargetDateKey,
			NewScheduledTime:  dto.NewTime,
			PrevScheduledTime: habit.ScheduledTime,
			CreatedAt:         time.Now(),
		}, nil
	}

	// For 'single' or 'future', persist in override repository
	override := &domain.HabitScheduleOverride{
		ID:                "ovr_" + uuid.NewString(),
		HabitID:           dto.HabitID,
		UserID:            habit.UserID,
		Scope:             dto.Scope,
		TargetDate:        dto.TargetDateKey,
		NewScheduledTime:  dto.NewTime,
		PrevScheduledTime: habit.ScheduledTime,
		CreatedAt:         time.Now(),
	}

	if err := u.overrideRepo.SaveOverride(ctx, override); err != nil {
		return nil, err
	}

	return override, nil
}

// GetEffectiveSchedule resolves each habit's scheduled time for a given date considering overrides.
func (u *scheduleOverrideUsecase) GetEffectiveSchedule(ctx context.Context, userID, dateKey string) ([]*domain.EffectiveScheduleDTO, error) {
	habits, err := u.habitRepo.GetHabitsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if dateKey == "" {
		dateKey = "2026-08-28"
	}

	var results []*domain.EffectiveScheduleDTO
	for _, h := range habits {
		effTime, isOverridden, scopeApplied, _ := u.overrideRepo.GetEffectiveTime(ctx, h.ID, dateKey, h.ScheduledTime)
		results = append(results, &domain.EffectiveScheduleDTO{
			HabitID:          h.ID,
			DateKey:          dateKey,
			ScheduledTime:    effTime,
			InitialTime:      h.ScheduledTime,
			IsOverridden:     isOverridden,
			ScopeApplied:     scopeApplied,
			ReplacementHabit: h.ReplacementHabit,
			BadHabit:         h.BadHabit,
			Category:         h.Category,
		})
	}

	return results, nil
}
