package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func LoadConfigFromEnv(defaultDBName string) *Config {
	host := os.Getenv("POSTGRES_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("POSTGRES_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("POSTGRES_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("POSTGRES_PASSWORD")
	if password == "" {
		password = "123"
	}
	dbname := os.Getenv("DB_NAME")
	if dbname == "" {
		dbname = os.Getenv("POSTGRES_DB")
	}
	if dbname == "" {
		dbname = defaultDBName
	}

	return &Config{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		DBName:   dbname,
		SSLMode:  "disable",
	}
}

// ConnectPostgres attempts connection with fallbacks for local developer environments
func ConnectPostgres(cfg *Config) (*sql.DB, error) {
	passwords := []string{cfg.Password, "123", "postgres", "habitizer_secret", "admin"}
	users := []string{cfg.User, "postgres", "habitizer"}

	var lastErr error
	for _, u := range users {
		for _, p := range passwords {
			connStr := fmt.Sprintf(
				"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
				cfg.Host, cfg.Port, u, p, cfg.DBName, cfg.SSLMode,
			)

			db, err := sql.Open("postgres", connStr)
			if err == nil {
				if pingErr := db.Ping(); pingErr == nil {
					return db, nil
				}
				db.Close()
				lastErr = err
			}
		}
	}

	return nil, fmt.Errorf("failed to connect to postgres (%s): %v", cfg.DBName, lastErr)
}
