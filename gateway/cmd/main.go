package main

import (
	"net/http"

	"github.com/habitizer/gateway/config"
	"github.com/habitizer/gateway/internal/handler"
	"github.com/habitizer/pkg/logger"
)

func main() {
	cfg := config.LoadConfig()
	log := logger.NewLogger("gateway-service")

	router := handler.NewRouter(cfg, log)

	log.Info("Starting API Gateway on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Error("API Gateway failed: %v", err)
	}
}
