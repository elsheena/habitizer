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

	// 1. Repositories
	habitRepo := postgres.NewHabitRepository(db)
	calRepo := postgres.NewCalendarEventRepository(db)
	overrideRepo := postgres.NewScheduleOverrideRepository(db)

	// 2. Focused Single-Responsibility Usecases
	habitUc := usecase.NewHabitUsecase(habitRepo)
	overrideUc := usecase.NewScheduleOverrideUsecase(habitRepo, overrideRepo)
	schedulerUc := usecase.NewSmartSchedulerUsecase(habitRepo, calRepo)
	calendarEventUc := usecase.NewCalendarEventUsecase(calRepo)

	// 3. Focused Single-Responsibility Handlers
	habitHandler := handler.NewHabitHandler(habitUc)
	overrideHandler := handler.NewScheduleOverrideHandler(overrideUc)
	schedulerHandler := handler.NewSchedulerHandler(schedulerUc)
	calendarEventHandler := handler.NewCalendarEventHandler(calendarEventUc)

	mux := http.NewServeMux()

	// Habit Loop CRUD & Check-in Routes
	mux.HandleFunc("/api/v1/habits", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			habitHandler.CreateHabit(w, r)
		} else if r.Method == http.MethodGet {
			habitHandler.GetUserHabits(w, r)
		} else if r.Method == http.MethodDelete {
			habitHandler.DeleteHabit(w, r)
		}
	})
	mux.HandleFunc("/api/v1/habits/log", habitHandler.LogOccurrence)
	mux.HandleFunc("/api/v1/habits/suggestions", habitHandler.GetSuggestedReplacements)
	mux.HandleFunc("/api/v1/habits/checkin", habitHandler.DailyCheckin)
	mux.HandleFunc("/api/v1/habits/promote-replacement", habitHandler.PromoteReplacement)
	mux.HandleFunc("/api/v1/habits/update-time", habitHandler.UpdateHabitTime)

	// Recurring Reschedule Scope & Effective Timetable Routes
	mux.HandleFunc("/api/v1/habits/schedule-scope", overrideHandler.ApplyScheduleScope)
	mux.HandleFunc("/api/v1/habits/effective-schedule", overrideHandler.GetEffectiveSchedule)

	// Smart Free-Slot Discovery & Conflict Engine Routes
	mux.HandleFunc("/api/v1/habits/free-slots", schedulerHandler.GetFreeSlots)
	mux.HandleFunc("/api/v1/habits/conflicts", schedulerHandler.DetectConflicts)
	mux.HandleFunc("/api/v1/habits/auto-schedule", schedulerHandler.AutoSchedule)

	// Calendar Events CRUD Route
	mux.HandleFunc("/api/v1/habits/calendar-events", calendarEventHandler.HandleCalendarEvents)

	log.Info("Starting Habit Service on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Error("Habit Service failed: %v", err)
	}
}
