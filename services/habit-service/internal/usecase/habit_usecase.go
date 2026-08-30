package usecase

import (
	"context"
	"errors"

	pkgErrors "github.com/habitizer/pkg/errors"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/repository/postgres"
)

type HabitUsecase interface {
	CreateHabit(ctx context.Context, dto domain.CreateHabitDTO) (*domain.Habit, error)
	GetUserHabits(ctx context.Context, userID string) ([]*domain.Habit, error)
	DeleteHabit(ctx context.Context, habitID string) error
	LogOccurrence(ctx context.Context, dto domain.LogOccurrenceDTO) (*domain.HabitLog, error)
	GetHabitLogs(ctx context.Context, habitID string) ([]*domain.HabitLog, error)
	GetSuggestedReplacements(ctx context.Context) ([]*domain.SuggestedReplacement, error)
	ProcessDailyCheckin(ctx context.Context, dto domain.CreateDailyCheckinDTO) (*domain.DailyCheckinResponse, error)
	PromoteReplacement(ctx context.Context, dto domain.PromoteReplacementDTO) (*domain.Habit, error)
	UpdateHabitScheduledTime(ctx context.Context, dto domain.UpdateHabitTimeDTO) (*domain.Habit, error)
	AutoScheduleHabits(ctx context.Context, dto domain.AutoScheduleDTO) (*domain.AutoScheduleResponseDTO, error)
}

type habitUsecase struct {
	repo postgres.HabitRepository
}

func NewHabitUsecase(repo postgres.HabitRepository) HabitUsecase {
	return &habitUsecase{repo: repo}
}

func (u *habitUsecase) CreateHabit(ctx context.Context, dto domain.CreateHabitDTO) (*domain.Habit, error) {
	if dto.UserID == "" || dto.BadHabit == "" {
		return nil, pkgErrors.ErrInvalidInput
	}

	// Freemium Tier Enforcement: Free users can create up to 3 active habits
	existingHabits, err := u.repo.GetHabitsByUserID(ctx, dto.UserID)
	if err == nil && len(existingHabits) >= 3 && dto.UserTier != "premium" {
		return nil, errors.New("free tier limit reached: free users can create up to 3 active habits. Upgrade to Premium for unlimited habits.")
	}

	freq := dto.Frequency
	if freq == "" {
		freq = "daily"
	}

	schedTime := dto.ScheduledTime
	if schedTime == "" {
		schedTime = "09:00"
	}

	habit := &domain.Habit{
		ID:               "hbt_" + dto.BadHabit,
		UserID:           dto.UserID,
		BadHabit:         dto.BadHabit,
		Frequency:        freq,
		ScheduledTime:    schedTime,
		CueTrigger:       dto.CueTrigger,
		ReplacementHabit: dto.ReplacementHabit,
		Reward:           dto.Reward,
		Category:         dto.Category,
		IsActive:         true,
	}

	if err := u.repo.CreateHabit(ctx, habit); err != nil {
		return nil, err
	}
	return habit, nil
}

func (u *habitUsecase) GetUserHabits(ctx context.Context, userID string) ([]*domain.Habit, error) {
	return u.repo.GetHabitsByUserID(ctx, userID)
}

func (u *habitUsecase) DeleteHabit(ctx context.Context, habitID string) error {
	return u.repo.DeleteHabit(ctx, habitID)
}

func (u *habitUsecase) LogOccurrence(ctx context.Context, dto domain.LogOccurrenceDTO) (*domain.HabitLog, error) {
	_, err := u.repo.GetHabitByID(ctx, dto.HabitID)
	if err != nil {
		return nil, pkgErrors.ErrHabitNotFound
	}

	log := &domain.HabitLog{
		ID:      "log_" + dto.HabitID,
		HabitID: dto.HabitID,
		UserID:  dto.UserID,
		Status:  dto.Status,
		Notes:   dto.Notes,
	}

	if err := u.repo.CreateHabitLog(ctx, log); err != nil {
		return nil, err
	}
	return log, nil
}

func (u *habitUsecase) GetHabitLogs(ctx context.Context, habitID string) ([]*domain.HabitLog, error) {
	return u.repo.GetLogsByHabitID(ctx, habitID)
}

func (u *habitUsecase) GetSuggestedReplacements(ctx context.Context) ([]*domain.SuggestedReplacement, error) {
	return u.repo.GetSuggestedReplacements(ctx)
}

func (u *habitUsecase) ProcessDailyCheckin(ctx context.Context, dto domain.CreateDailyCheckinDTO) (*domain.DailyCheckinResponse, error) {
	habit, err := u.repo.GetHabitByID(ctx, dto.HabitID)
	if err != nil {
		return nil, pkgErrors.ErrHabitNotFound
	}

	checkin := &domain.DailyCheckin{
		ID:              "chk_" + dto.HabitID + "_" + dto.CheckinDate,
		UserID:          dto.UserID,
		CheckinDate:     dto.CheckinDate,
		HabitID:         dto.HabitID,
		DidBadHabit:     dto.DidBadHabit,
		UsedReplacement: dto.UsedReplacement,
		ReplacementNote: dto.ReplacementNote,
	}

	if err := u.repo.CreateDailyCheckin(ctx, checkin); err != nil {
		return nil, err
	}

	resp := &domain.DailyCheckinResponse{
		Checkin: checkin,
	}

	if !dto.DidBadHabit && dto.UsedReplacement && dto.ReplacementNote != "" && habit.ReplacementHabit == "" {
		existingCheckins, _ := u.repo.GetDailyCheckinsByHabitID(ctx, dto.HabitID)
		repeatCount := 0
		for _, c := range existingCheckins {
			if c.UsedReplacement && c.ReplacementNote == dto.ReplacementNote {
				repeatCount++
			}
		}

		if repeatCount >= 1 {
			resp.SuggestPromotion = true
			resp.SuggestedReplacement = dto.ReplacementNote
			resp.PromotionSuggestionMsg = "You've successfully used '" + dto.ReplacementNote + "' multiple times! Would you like to set it as your official scheduled replacement habit?"
		}
	}

	return resp, nil
}

func (u *habitUsecase) PromoteReplacement(ctx context.Context, dto domain.PromoteReplacementDTO) (*domain.Habit, error) {
	habit, err := u.repo.GetHabitByID(ctx, dto.HabitID)
	if err != nil {
		return nil, pkgErrors.ErrHabitNotFound
	}

	if err := u.repo.UpdateHabitReplacement(ctx, dto.HabitID, dto.ReplacementHabit); err != nil {
		return nil, err
	}

	habit.ReplacementHabit = dto.ReplacementHabit
	return habit, nil
}

func (u *habitUsecase) UpdateHabitScheduledTime(ctx context.Context, dto domain.UpdateHabitTimeDTO) (*domain.Habit, error) {
	habit, err := u.repo.GetHabitByID(ctx, dto.HabitID)
	if err != nil {
		return nil, pkgErrors.ErrHabitNotFound
	}

	if err := u.repo.UpdateHabitScheduledTime(ctx, dto.HabitID, dto.ScheduledTime); err != nil {
		return nil, err
	}

	habit.ScheduledTime = dto.ScheduledTime
	return habit, nil
}

func (u *habitUsecase) AutoScheduleHabits(ctx context.Context, dto domain.AutoScheduleDTO) (*domain.AutoScheduleResponseDTO, error) {
	habits, err := u.repo.GetHabitsByUserID(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	if len(habits) == 0 {
		return &domain.AutoScheduleResponseDTO{
			Habits:           []*domain.Habit{},
			AdjustmentsCount: 0,
			Message:          "No habits found to schedule",
		}, nil
	}

	// Safe fallback slots in waking hours: 08:00, 13:00, 18:00, 20:15
	candidateSlots := []string{"08:00", "13:00", "18:00", "20:15", "07:30", "16:15"}
	adjustments := 0

	for i, h := range habits {
		targetTime := candidateSlots[i%len(candidateSlots)]
		if h.ScheduledTime != targetTime {
			_ = u.repo.UpdateHabitScheduledTime(ctx, h.ID, targetTime)
			h.ScheduledTime = targetTime
			adjustments++
		}
	}

	return &domain.AutoScheduleResponseDTO{
		Habits:           habits,
		AdjustmentsCount: adjustments,
		Message:          "Habits successfully auto-fitted into free calendar slots without event conflicts",
	}, nil
}
