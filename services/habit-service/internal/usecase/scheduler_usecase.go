package usecase

import (
	"context"

	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/repository/postgres"
)

// SmartSchedulerUsecase defines operations for discovering free calendar slots, conflict analysis, and smart placement.
type SmartSchedulerUsecase interface {
	GetFreeSlots(ctx context.Context, dto domain.FreeSlotsRequestDTO) ([]*domain.FreeSlotDTO, error)
	DetectConflicts(ctx context.Context, dto domain.ConflictCheckRequestDTO) ([]*domain.ConflictReportDTO, error)
	AutoScheduleHabits(ctx context.Context, dto domain.AutoScheduleDTO) (*domain.AutoScheduleResponseDTO, error)
}

type smartSchedulerUsecase struct {
	habitRepo    postgres.HabitRepository
	calendarRepo postgres.CalendarEventRepository
}

func NewSmartSchedulerUsecase(habitRepo postgres.HabitRepository, calRepo postgres.CalendarEventRepository) SmartSchedulerUsecase {
	return &smartSchedulerUsecase{
		habitRepo:    habitRepo,
		calendarRepo: calRepo,
	}
}

// GetFreeSlots finds available gaps using interval arithmetic.
func (u *smartSchedulerUsecase) GetFreeSlots(ctx context.Context, dto domain.FreeSlotsRequestDTO) ([]*domain.FreeSlotDTO, error) {
	events := dto.Events
	if len(events) == 0 && dto.UserID != "" {
		calEvents, err := u.calendarRepo.GetEventsByUserID(ctx, dto.UserID)
		if err == nil {
			for _, ce := range calEvents {
				events = append(events, domain.CalendarEventDTO{
					ID:            ce.ID,
					UserID:        ce.UserID,
					Title:         ce.Title,
					Description:   ce.Description,
					Date:          ce.Date,
					StartTime:     ce.StartTime,
					EndTime:       ce.EndTime,
					Location:      ce.Location,
					Tag:           ce.Tag,
					IsGoogleEvent: ce.IsGoogleEvent,
				})
			}
		}
	}

	slots := CalculateFreeSlots(events, dto.Date, dto.DayStart, dto.DayEnd)
	return slots, nil
}

// DetectConflicts reports clashes between scheduled habits and calendar events.
func (u *smartSchedulerUsecase) DetectConflicts(ctx context.Context, dto domain.ConflictCheckRequestDTO) ([]*domain.ConflictReportDTO, error) {
	habits, err := u.habitRepo.GetHabitsByUserID(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	events := dto.Events
	if len(events) == 0 && dto.UserID != "" {
		calEvents, err := u.calendarRepo.GetEventsByUserID(ctx, dto.UserID)
		if err == nil {
			for _, ce := range calEvents {
				events = append(events, domain.CalendarEventDTO{
					ID:            ce.ID,
					UserID:        ce.UserID,
					Title:         ce.Title,
					Description:   ce.Description,
					Date:          ce.Date,
					StartTime:     ce.StartTime,
					EndTime:       ce.EndTime,
					Location:      ce.Location,
					Tag:           ce.Tag,
					IsGoogleEvent: ce.IsGoogleEvent,
				})
			}
		}
	}

	conflicts := DetectEventHabitConflicts(habits, events, dto.Date)
	return conflicts, nil
}

// AutoScheduleHabits schedules habits into conflict-free free slots on the calendar.
func (u *smartSchedulerUsecase) AutoScheduleHabits(ctx context.Context, dto domain.AutoScheduleDTO) (*domain.AutoScheduleResponseDTO, error) {
	habits, err := u.habitRepo.GetHabitsByUserID(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	events := dto.Events
	if len(events) == 0 && dto.UserID != "" {
		calEvents, err := u.calendarRepo.GetEventsByUserID(ctx, dto.UserID)
		if err == nil {
			for _, ce := range calEvents {
				events = append(events, domain.CalendarEventDTO{
					ID:            ce.ID,
					UserID:        ce.UserID,
					Title:         ce.Title,
					Description:   ce.Description,
					Date:          ce.Date,
					StartTime:     ce.StartTime,
					EndTime:       ce.EndTime,
					Location:      ce.Location,
					Tag:           ce.Tag,
					IsGoogleEvent: ce.IsGoogleEvent,
				})
			}
		}
	}

	targetDate := dto.Date
	if targetDate == "" {
		targetDate = "2026-08-28"
	}

	result, updatedHabits := SmartAutoSchedule(habits, events, targetDate)
	for _, h := range updatedHabits {
		_ = u.habitRepo.UpdateHabitScheduledTime(ctx, h.ID, h.ScheduledTime)
	}

	return &domain.AutoScheduleResponseDTO{
		Habits:           updatedHabits,
		AdjustmentsCount: result.AdjustmentsCount,
		Message:          result.Message,
	}, nil
}
