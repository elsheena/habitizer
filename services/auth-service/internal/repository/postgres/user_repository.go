package postgres

import (
	"context"
	"database/sql"
	"errors"
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
		ID:        "usr_demo",
		Email:     "alex.doe@habitizer.io",
		FullName:  "Alex Doe",
		Tier:      "free",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	repo.memUsers[demoUser.ID] = demoUser

	// If DB connected, ensure schema table exists
	if db != nil {
		_, _ = db.Exec(`
			CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
			CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
				email VARCHAR(255) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				full_name VARCHAR(100) NOT NULL,
				tier VARCHAR(50) DEFAULT 'free',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
			);
		`)
	}

	return repo
}

func (r *PostgresUserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	if user.ID == "" {
		user.ID = uuid.NewString()
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	if user.Tier == "" {
		user.Tier = "free"
	}

	if r.db != nil {
		query := `
			INSERT INTO users (id, email, password_hash, full_name, tier, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`
		_, err := r.db.ExecContext(ctx, query,
			user.ID, user.Email, user.PasswordHash, user.FullName, user.Tier, user.CreatedAt, user.UpdatedAt,
		)
		if err != nil {
			return err
		}
		return nil
	}

	// Fallback to memory
	r.memMu.Lock()
	defer r.memMu.Unlock()

	for _, u := range r.memUsers {
		if u.Email == user.Email {
			return errors.New("email already registered")
		}
	}

	r.memUsers[user.ID] = user
	return nil
}

func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	if r.db != nil {
		query := `SELECT id, email, password_hash, full_name, tier, created_at, updated_at FROM users WHERE email = $1`
		row := r.db.QueryRowContext(ctx, query, email)

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
		if u.Email == email {
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
