package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/analytics-service/internal/domain"
	"github.com/habitizer/services/analytics-service/internal/usecase"
)

type AnalyticsHandler struct {
	usecase usecase.AnalyticsUsecase
}

func NewAnalyticsHandler(uc usecase.AnalyticsUsecase) *AnalyticsHandler {
	return &AnalyticsHandler{usecase: uc}
}

func (h *AnalyticsHandler) GetStreaks(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	habitID := r.URL.Query().Get("habit_id")

	if habitID != "" {
		streak, err := h.usecase.GetHabitStreak(r.Context(), habitID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusOK, streak, "Habit streak retrieved")
		return
	}

	if userID == "" {
		userID = "usr_demo"
	}

	streaks, err := h.usecase.GetUserStreaks(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, streaks, "User habit streaks retrieved")
}

func (h *AnalyticsHandler) GetEconomy(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "usr_demo"
	}

	eco, err := h.usecase.GetUserEconomy(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, eco, "User economy & rewards retrieved")
}

func (h *AnalyticsHandler) BuyStreakFreeze(w http.ResponseWriter, r *http.Request) {
	var dto domain.BuyStreakFreezeDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	eco, err := h.usecase.BuyStreakFreeze(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, eco, "Streak freeze purchased successfully")
}

func (h *AnalyticsHandler) RedeemReward(w http.ResponseWriter, r *http.Request) {
	var dto domain.RedeemRewardDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	eco, err := h.usecase.RedeemReward(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, eco, "Reward redeemed successfully")
}

func (h *AnalyticsHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = "usr_demo"
	}

	prof, err := h.usecase.GetUserProfile(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, prof, "User profile analytics summary retrieved")
}
