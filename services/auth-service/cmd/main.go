package main

import (
	"net/http"
	"os"

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

	repo := postgres.NewUserRepository()
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
