package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/usecase"
)

// HabitHandler manages HTTP endpoints for habit loops, logs, check-ins, and replacement suggestions.
type HabitHandler struct {
	usecase usecase.HabitUsecase
}

func NewHabitHandler(uc usecase.HabitUsecase) *HabitHandler {
	return &HabitHandler{usecase: uc}
}

func (h *HabitHandler) CreateHabit(w http.ResponseWriter, r *http.Request) {
	var dto domain.CreateHabitDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.CreateHabit(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, res, "Habit substitution created successfully")
}

func (h *HabitHandler) GetUserHabits(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "usr_demo"
	}

	habits, err := h.usecase.GetUserHabits(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, habits, "User habits retrieved")
}

func (h *HabitHandler) DeleteHabit(w http.ResponseWriter, r *http.Request) {
	habitID := r.URL.Query().Get("id")
	if habitID == "" {
		response.Error(w, http.StatusBadRequest, "id query param required", nil)
		return
	}

	if err := h.usecase.DeleteHabit(r.Context(), habitID); err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, nil, "Habit deleted successfully")
}

func (h *HabitHandler) LogOccurrence(w http.ResponseWriter, r *http.Request) {
	var dto domain.LogOccurrenceDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	logRes, err := h.usecase.LogOccurrence(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, logRes, "Habit occurrence logged successfully")
}

func (h *HabitHandler) GetSuggestedReplacements(w http.ResponseWriter, r *http.Request) {
	suggestions, err := h.usecase.GetSuggestedReplacements(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, suggestions, "Suggested habit replacements retrieved")
}

func (h *HabitHandler) DailyCheckin(w http.ResponseWriter, r *http.Request) {
	var dto domain.CreateDailyCheckinDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.ProcessDailyCheckin(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Nightly check-in recorded successfully")
}

func (h *HabitHandler) PromoteReplacement(w http.ResponseWriter, r *http.Request) {
	var dto domain.PromoteReplacementDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.PromoteReplacement(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Replacement habit promoted successfully")
}

func (h *HabitHandler) UpdateHabitTime(w http.ResponseWriter, r *http.Request) {
	var dto domain.UpdateHabitTimeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.UpdateHabitScheduledTime(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Habit scheduled time updated successfully")
}
