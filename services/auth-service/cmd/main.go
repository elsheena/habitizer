package main

import (
	"net/http"
	"os"

	"github.com/habitizer/pkg/database"
	"github.com/habitizer/pkg/logger"
	handler "github.com/habitizer/services/auth-service/internal/handler/http"
	"github.com/habitizer/services/auth-service/internal/repository/postgres"
	"github.com/habitizer/services/auth-service/internal/usecase"
)

func main() {
	log := logger.NewLogger("auth-service")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	// Database-per-service: Connect to habitizer_auth_db
	dbCfg := database.LoadConfigFromEnv("habitizer_auth_db")
	db, err := database.ConnectPostgres(dbCfg)
	if err != nil {
		log.Warn("Could not connect to PostgreSQL auth database (%s): %v. Using in-memory fallback.", dbCfg.DBName, err)
	} else {
		log.Info("Connected to PostgreSQL auth database: %s", dbCfg.DBName)
	}

	repo := postgres.NewUserRepository(db)
	uc := usecase.NewAuthUsecase(repo)
	h := handler.NewAuthHandler(uc)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/auth/register", h.Register)
	mux.HandleFunc("/api/v1/auth/login", h.Login)

	log.Info("Starting Auth Service on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Error("Auth Service failed: %v", err)
	}
}
