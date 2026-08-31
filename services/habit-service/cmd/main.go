package main

import (
	"net/http"
	"os"

	"github.com/habitizer/pkg/database"
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

	// Database-per-service: Connect to habitizer_habit_db
	dbCfg := database.LoadConfigFromEnv("habitizer_habit_db")
	db, err := database.ConnectPostgres(dbCfg)
	if err != nil {
		log.Warn("Could not connect to PostgreSQL habit database (%s): %v. Using in-memory fallback.", dbCfg.DBName, err)
	} else {
		log.Info("Connected to PostgreSQL habit database: %s", dbCfg.DBName)
	}

	habitRepo := postgres.NewHabitRepository(db)
	calRepo := postgres.NewCalendarEventRepository(db)
	uc := usecase.NewHabitUsecase(habitRepo, calRepo)
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
	mux.HandleFunc("/api/v1/habits/auto-schedule", h.AutoSchedule)
	mux.HandleFunc("/api/v1/habits/update-time", h.UpdateHabitTime)
	mux.HandleFunc("/api/v1/habits/calendar-events", h.HandleCalendarEvents)

	log.Info("Starting Habit Service on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Error("Habit Service failed: %v", err)
	}
}
