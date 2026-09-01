package postgres

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/habitizer/pkg/uuid"
	"github.com/habitizer/services/auth-service/internal/domain"
)

type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
}

type PostgresUserRepository struct {
	db       *sql.DB
	memMu    sync.RWMutex
	memUsers map[string]*domain.User
}

func NewUserRepository(db *sql.DB) UserRepository {
	repo := &PostgresUserRepository{
		db:       db,
		memUsers: make(map[string]*domain.User),
	}

	// Seed demo user in memory fallback
	demoUser := &domain.User{
		ID:           "usr_demo",
		Email:        "alex.doe@habitizer.io",
		PasswordHash: "hashed_HabitSecure#2026",
		FullName:     "Alex Doe",
		Tier:         "free",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	repo.memUsers[demoUser.ID] = demoUser

	// If DB connected, ensure schema table exists and seed demo user
	if db != nil {
		_, _ = db.Exec(`
			CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
			CREATE TABLE IF NOT EXISTS users (
				id VARCHAR(100) PRIMARY KEY,
				email VARCHAR(255) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				full_name VARCHAR(100) NOT NULL,
				tier VARCHAR(50) DEFAULT 'free',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
			INSERT INTO users (id, email, password_hash, full_name, tier)
			VALUES ('usr_demo', 'alex.doe@habitizer.io', 'hashed_HabitSecure#2026', 'Alex Doe', 'free')
			ON CONFLICT (email) DO NOTHING;
		`)
	}

	return repo
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	if user.ID == "" {
		user.ID = "usr_" + uuid.NewString()
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	if user.Tier == "" {
		user.Tier = "free"
	}
	cleanEmail := strings.ToLower(strings.TrimSpace(user.Email))
	user.Email = cleanEmail

	// Save to memory
	r.memMu.Lock()
	r.memUsers[user.ID] = user
	r.memMu.Unlock()

	if r.db != nil {
		query := `
			INSERT INTO users (id, email, password_hash, full_name, tier, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name
		`
		_, err := r.db.ExecContext(ctx, query,
			user.ID, user.Email, user.PasswordHash, user.FullName, user.Tier, user.CreatedAt, user.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))

	if r.db != nil {
		query := `SELECT id, email, password_hash, full_name, tier, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)`
		row := r.db.QueryRowContext(ctx, query, cleanEmail)

		var u domain.User
		err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Tier, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			return &u, nil
		}
	}

	// Fallback to memory
	r.memMu.RLock()
	defer r.memMu.RUnlock()

	for _, u := range r.memUsers {
		if strings.EqualFold(u.Email, cleanEmail) {
			return u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (r *PostgresUserRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	if r.db != nil {
		query := `SELECT id, email, password_hash, full_name, tier, created_at, updated_at FROM users WHERE id = $1`
		row := r.db.QueryRowContext(ctx, query, id)

		var u domain.User
		err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Tier, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			return &u, nil
		}
	}

	// Fallback to memory
	r.memMu.RLock()
	defer r.memMu.RUnlock()

	u, exists := r.memUsers[id]
	if !exists {
		return nil, errors.New("user not found")
	}
	return u, nil
}
