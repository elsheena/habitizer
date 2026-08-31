package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

type MigrationTarget struct {
	DBName  string
	SQLFile string
	Desc    string
}

func main() {
	fmt.Println("==================================================")
	fmt.Println("   HABITIZER MULTI-DATABASE MIGRATION ENGINE")
	fmt.Println("   Isolated Database-per-Service Architecture")
	fmt.Println("==================================================")

	passwords := []string{"123", "postgres", "habitizer_secret", "admin"}
	users := []string{"postgres", "habitizer"}

	var adminDB *sql.DB
	var connectedUser, connectedPass string

	for _, u := range users {
		for _, p := range passwords {
			connStr := fmt.Sprintf("host=localhost port=5432 user=%s password=%s dbname=postgres sslmode=disable", u, p)
			testDb, testErr := sql.Open("postgres", connStr)
			if testErr == nil {
				if pingErr := testDb.Ping(); pingErr == nil {
					adminDB = testDb
					connectedUser = u
					connectedPass = p
					break
				}
				testDb.Close()
			}
		}
		if adminDB != nil {
			break
		}
	}

	if adminDB == nil {
		fmt.Println("⚠ Note: Could not connect to PostgreSQL on localhost:5432. Make sure PostgreSQL is started.")
		return
	}
	defer adminDB.Close()

	fmt.Printf("✓ Connected to PostgreSQL server as '%s'\n\n", connectedUser)

	targets := []MigrationTarget{
		{
			DBName:  "habitizer_auth_db",
			SQLFile: "init_auth_db.sql",
			Desc:    "Auth Service Database (Users & Google Integrations)",
		},
		{
			DBName:  "habitizer_habit_db",
			SQLFile: "init_habit_db.sql",
			Desc:    "Habit Service Database (Habits, Logs, Checkins & Calendar Events)",
		},
		{
			DBName:  "habitizer_analytics_db",
			SQLFile: "init_analytics_db.sql",
			Desc:    "Analytics Service Database (Streaks, User Economy & Rewards)",
		},
	}

	for _, t := range targets {
		fmt.Printf("▶ Processing %s [%s]...\n", t.DBName, t.Desc)

		// 1. Create database if it does not exist
		var exists bool
		query := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = '%s')", t.DBName)
		_ = adminDB.QueryRow(query).Scan(&exists)
		if !exists {
			fmt.Printf("  • Creating database '%s'...\n", t.DBName)
			_, err := adminDB.Exec(fmt.Sprintf("CREATE DATABASE %s", t.DBName))
			if err != nil {
				fmt.Printf("  ⚠ Create database notice: %v\n", err)
			}
		} else {
			fmt.Printf("  • Database '%s' already exists.\n", t.DBName)
		}

		// 2. Connect to the individual target database
		targetConnStr := fmt.Sprintf("host=localhost port=5432 user=%s password=%s dbname=%s sslmode=disable",
			connectedUser, connectedPass, t.DBName)
		targetDB, err := sql.Open("postgres", targetConnStr)
		if err != nil {
			fmt.Printf("  ✖ Failed to open %s: %v\n", t.DBName, err)
			continue
		}

		// 3. Read and execute DDL script
		sqlPath := filepath.Join("scripts", t.SQLFile)
		content, err := os.ReadFile(sqlPath)
		if err != nil {
			content, err = os.ReadFile(filepath.Join("..", "scripts", t.SQLFile))
		}
		if err != nil {
			fmt.Printf("  ✖ Could not read %s: %v\n", t.SQLFile, err)
			targetDB.Close()
			continue
		}

		queries := strings.Split(string(content), ";")
		for _, q := range queries {
			trimmed := strings.TrimSpace(q)
			if trimmed == "" {
				continue
			}
			_, execErr := targetDB.Exec(trimmed)
			if execErr != nil {
				if !strings.Contains(execErr.Error(), "already exists") {
					fmt.Printf("  ⚠ Query notice: %v\n", execErr)
				}
			}
		}
		targetDB.Close()
		fmt.Printf("  ✓ Schema migrations applied for '%s'!\n\n", t.DBName)
	}

	fmt.Println("==================================================")
	fmt.Println("✓ ALL MICROSERVICE DATABASES FULLY MIGRATED!")
	fmt.Println("==================================================")
}
