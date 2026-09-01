package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/usecase"
)

// ScheduleOverrideHandler handles HTTP endpoints for 3-point recurring schedule scope and effective daily schedule.
type ScheduleOverrideHandler struct {
	usecase usecase.ScheduleOverrideUsecase
}

func NewScheduleOverrideHandler(uc usecase.ScheduleOverrideUsecase) *ScheduleOverrideHandler {
	return &ScheduleOverrideHandler{usecase: uc}
}

// ApplyScheduleScope handles POST /api/v1/habits/schedule-scope
func (h *ScheduleOverrideHandler) ApplyScheduleScope(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var dto domain.RescheduleScopeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.ApplyScheduleScope(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Schedule scope override applied successfully")
}

// GetEffectiveSchedule handles GET /api/v1/habits/effective-schedule
func (h *ScheduleOverrideHandler) GetEffectiveSchedule(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "usr_demo"
	}
	dateKey := r.URL.Query().Get("date")
	if dateKey == "" {
		dateKey = "2026-08-28"
	}

	schedules, err := h.usecase.GetEffectiveSchedule(r.Context(), userID, dateKey)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, schedules, "Effective habit schedules retrieved")
}
