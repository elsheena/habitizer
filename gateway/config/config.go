package config

import (
	"github.com/habitizer/pkg/config"
)

type Config struct {
	Port                string
	AuthServiceURL      string
	HabitServiceURL     string
	AnalyticsServiceURL string
}

func LoadConfig() *Config {
	return &Config{
		Port:                config.GetEnv("PORT", "8000"),
		AuthServiceURL:      config.GetEnv("AUTH_SERVICE_URL", "http://localhost:8001"),
		HabitServiceURL:     config.GetEnv("HABIT_SERVICE_URL", "http://localhost:8002"),
		AnalyticsServiceURL: config.GetEnv("ANALYTICS_SERVICE_URL", "http://localhost:8003"),
	}
}
