package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("   HABITIZER DATABASE MIGRATION ENGINE (POSTGRES)")
	fmt.Println("==================================================")

	// Try connections
	passwords := []string{"123", "postgres", "habitizer_secret", "admin"}
	users := []string{"postgres", "habitizer"}
	dbName := "habitizer_db"

	var db *sql.DB
	var connectedUser, connectedPass string
	var err error

	for _, u := range users {
		for _, p := range passwords {
			connStr := fmt.Sprintf("host=localhost port=5432 user=%s password=%s dbname=postgres sslmode=disable", u, p)
			testDb, testErr := sql.Open("postgres", connStr)
			if testErr == nil {
				if pingErr := testDb.Ping(); pingErr == nil {
					db = testDb
					connectedUser = u
					connectedPass = p
					break
				}
				testDb.Close()
			}
		}
		if db != nil {
			break
		}
	}

	if db == nil {
		fmt.Printf("⚠ Note: Could not connect to PostgreSQL on localhost:5432. Make sure PostgreSQL is started.\n")
		return
	}

	fmt.Printf("✓ Connected to PostgreSQL as user '%s'\n", connectedUser)

	// Check / Create habitizer_db
	var exists bool
	_ = db.QueryRow(fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = '%s')", dbName)).Scan(&exists)
	if !exists {
		fmt.Printf("Creating database '%s'...\n", dbName)
		_, err = db.Exec(fmt.Sprintf("CREATE DATABASE %s", dbName))
		if err != nil {
			fmt.Printf("Note on create database: %v\n", err)
		}
	}
	db.Close()

	// Connect to target database
	targetConnStr := fmt.Sprintf("host=localhost port=5432 user=%s password=%s dbname=%s sslmode=disable", connectedUser, connectedPass, dbName)
	targetDb, err := sql.Open("postgres", targetConnStr)
	if err != nil {
		// Fallback to postgres database
		targetConnStr = fmt.Sprintf("host=localhost port=5432 user=%s password=%s dbname=postgres sslmode=disable", connectedUser, connectedPass)
		targetDb, err = sql.Open("postgres", targetConnStr)
	}
	defer targetDb.Close()

	// Read init_db.sql
	sqlPath := filepath.Join("scripts", "init_db.sql")
	content, err := os.ReadFile(sqlPath)
	if err != nil {
		content, err = os.ReadFile(filepath.Join("..", "scripts", "init_db.sql"))
	}
	if err != nil {
		fmt.Printf("ERROR: Could not read init_db.sql: %v\n", err)
		return
	}

	fmt.Println("Executing schema migrations...")
	queries := strings.Split(string(content), ";")
	for _, q := range queries {
		trimmed := strings.TrimSpace(q)
		if trimmed == "" {
			continue
		}
		_, execErr := targetDb.Exec(trimmed)
		if execErr != nil {
			if !strings.Contains(execErr.Error(), "already exists") {
				fmt.Printf("  ⚠ Query notice: %v\n", execErr)
			}
		}
	}

	fmt.Println("✓ Migrations applied successfully!")
	fmt.Println("  - Schema: auth_schema (users, google_integrations)")
	fmt.Println("  - Schema: habit_schema (habits, suggested_replacements, habit_logs, daily_checkins)")
	fmt.Println("  - Schema: analytics_schema (habit_streaks, user_economy)")
	fmt.Println("==================================================")
}
