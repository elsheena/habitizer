package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/usecase"
)

// SchedulerHandler handles HTTP endpoints for free-slots calculation, conflict detection, and smart placement.
type SchedulerHandler struct {
	usecase usecase.SmartSchedulerUsecase
}

func NewSchedulerHandler(uc usecase.SmartSchedulerUsecase) *SchedulerHandler {
	return &SchedulerHandler{usecase: uc}
}

// GetFreeSlots handles POST /api/v1/habits/free-slots
func (h *SchedulerHandler) GetFreeSlots(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var dto domain.FreeSlotsRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	slots, err := h.usecase.GetFreeSlots(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, slots, "Free calendar slots retrieved")
}

// DetectConflicts handles POST /api/v1/habits/conflicts
func (h *SchedulerHandler) DetectConflicts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var dto domain.ConflictCheckRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	conflicts, err := h.usecase.DetectConflicts(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, conflicts, "Calendar conflict report retrieved")
}

// AutoSchedule handles POST /api/v1/habits/auto-schedule
func (h *SchedulerHandler) AutoSchedule(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
		return
	}

	var dto domain.AutoScheduleDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.AutoScheduleHabits(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Habits scheduled into free calendar slots")
}
