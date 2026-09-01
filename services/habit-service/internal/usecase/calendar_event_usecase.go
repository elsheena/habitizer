package usecase

import (
	"context"

	pkgErrors "github.com/habitizer/pkg/errors"
	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/repository/postgres"
)

// CalendarEventUsecase defines CRUD operations for user timetable calendar events.
type CalendarEventUsecase interface {
	CreateCalendarEvent(ctx context.Context, dto domain.CalendarEventDTO) (*domain.CalendarEvent, error)
	GetCalendarEvents(ctx context.Context, userID string) ([]*domain.CalendarEvent, error)
	UpdateCalendarEvent(ctx context.Context, dto domain.CalendarEventDTO) (*domain.CalendarEvent, error)
	DeleteCalendarEvent(ctx context.Context, id string) error
}

type calendarEventUsecase struct {
	calendarRepo postgres.CalendarEventRepository
}

func NewCalendarEventUsecase(calRepo postgres.CalendarEventRepository) CalendarEventUsecase {
	return &calendarEventUsecase{
		calendarRepo: calRepo,
	}
}

func (u *calendarEventUsecase) CreateCalendarEvent(ctx context.Context, dto domain.CalendarEventDTO) (*domain.CalendarEvent, error) {
	if dto.Title == "" {
		return nil, pkgErrors.ErrInvalidInput
	}

	ev := &domain.CalendarEvent{
		ID:            dto.ID,
		UserID:        dto.UserID,
		Title:         dto.Title,
		Description:   dto.Description,
		Date:          dto.Date,
		StartTime:     dto.StartTime,
		EndTime:       dto.EndTime,
		Location:      dto.Location,
		Tag:           dto.Tag,
		IsGoogleEvent: dto.IsGoogleEvent,
	}
	if ev.ID == "" {
		ev.ID = "ev_" + uuid.NewString()
	}
	if ev.UserID == "" {
		ev.UserID = "usr_demo"
	}
	if ev.Date == "" {
		ev.Date = "2026-08-28"
	}
	if ev.StartTime == "" {
		ev.StartTime = "09:00"
	}
	if ev.EndTime == "" {
		ev.EndTime = "10:00"
	}

	if err := u.calendarRepo.CreateEvent(ctx, ev); err != nil {
		return nil, err
	}
	return ev, nil
}

func (u *calendarEventUsecase) GetCalendarEvents(ctx context.Context, userID string) ([]*domain.CalendarEvent, error) {
	if userID == "" {
		userID = "usr_demo"
	}
	return u.calendarRepo.GetEventsByUserID(ctx, userID)
}

func (u *calendarEventUsecase) UpdateCalendarEvent(ctx context.Context, dto domain.CalendarEventDTO) (*domain.CalendarEvent, error) {
	if dto.ID == "" {
		return nil, pkgErrors.ErrInvalidInput
	}
	ev := &domain.CalendarEvent{
		ID:            dto.ID,
		UserID:        dto.UserID,
		Title:         dto.Title,
		Description:   dto.Description,
		Date:          dto.Date,
		StartTime:     dto.StartTime,
		EndTime:       dto.EndTime,
		Location:      dto.Location,
		Tag:           dto.Tag,
		IsGoogleEvent: dto.IsGoogleEvent,
	}
	if err := u.calendarRepo.UpdateEvent(ctx, ev); err != nil {
		return nil, err
	}
	return ev, nil
}

func (u *calendarEventUsecase) DeleteCalendarEvent(ctx context.Context, id string) error {
	if id == "" {
		return pkgErrors.ErrInvalidInput
	}
	return u.calendarRepo.DeleteEvent(ctx, id)
}
