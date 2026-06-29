package main

import (
	"net/http"
	"os"

	"github.com/habitizer/pkg/logger"
	handler "github.com/habitizer/services/habit-service/internal/handler/http"
	"github.com/habitizer/services/habit-service/internal/repository/postgres"
	"github.com/habitizer/services/habit-service/internal/usecase"
)

func main() {
	log := logger.NewLogger("habit-service")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	repo := postgres.NewHabitRepository()
	uc := usecase.NewHabitUsecase(repo)
	h := handler.NewHabitHandler(uc)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/habits", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			h.CreateHabit(w, r)
		} else if r.Method == http.MethodGet {
			h.GetUserHabits(w, r)
		} else if r.Method == http.MethodDelete {
			h.DeleteHabit(w, r)
		}
	})
	mux.HandleFunc("/api/v1/habits/log", h.LogOccurrence)
	mux.HandleFunc("/api/v1/habits/suggestions", h.GetSuggestedReplacements)
	mux.HandleFunc("/api/v1/habits/checkin", h.DailyCheckin)
	mux.HandleFunc("/api/v1/habits/promote-replacement", h.PromoteReplacement)

	log.Info("Starting Habit Service on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Error("Habit Service failed: %v", err)
	}
}
