package main

import (
	"net/http"
	"os"

	"github.com/habitizer/pkg/database"
	"github.com/habitizer/pkg/logger"
	handler "github.com/habitizer/services/analytics-service/internal/handler/http"
	"github.com/habitizer/services/analytics-service/internal/repository/postgres"
	"github.com/habitizer/services/analytics-service/internal/usecase"
)

func main() {
	log := logger.NewLogger("analytics-service")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	// Database-per-service: Connect to habitizer_analytics_db
	dbCfg := database.LoadConfigFromEnv("habitizer_analytics_db")
	db, err := database.ConnectPostgres(dbCfg)
	if err != nil {
		log.Warn("Could not connect to PostgreSQL analytics database (%s): %v. Using in-memory fallback.", dbCfg.DBName, err)
	} else {
		log.Info("Connected to PostgreSQL analytics database: %s", dbCfg.DBName)
	}

	repo := postgres.NewAnalyticsRepository(db)
	uc := usecase.NewAnalyticsUsecase(repo)
	h := handler.NewAnalyticsHandler(uc)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/analytics/streaks", h.GetStreaks)
	mux.HandleFunc("/api/v1/analytics/economy", h.GetEconomy)
	mux.HandleFunc("/api/v1/analytics/economy/buy-freeze", h.BuyStreakFreeze)
	mux.HandleFunc("/api/v1/analytics/economy/redeem-reward", h.RedeemReward)
	mux.HandleFunc("/api/v1/analytics/profile", h.GetUserProfile)

	log.Info("Starting Analytics Service on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Error("Analytics Service failed: %v", err)
	}
}
