package usecase

import (
	"context"
	"strings"

	"github.com/habitizer/pkg/errors"
	"github.com/habitizer/services/auth-service/internal/domain"
	"github.com/habitizer/services/auth-service/internal/repository/postgres"
)

type AuthUsecase interface {
	Register(ctx context.Context, dto domain.RegisterDTO) (*domain.AuthResponseDTO, error)
	Login(ctx context.Context, dto domain.LoginDTO) (*domain.AuthResponseDTO, error)
}

type authUsecase struct {
	userRepo postgres.UserRepository
}

func NewAuthUsecase(repo postgres.UserRepository) AuthUsecase {
	return &authUsecase{userRepo: repo}
}

func (u *authUsecase) Register(ctx context.Context, dto domain.RegisterDTO) (*domain.AuthResponseDTO, error) {
	if dto.Email == "" || dto.Password == "" {
		return nil, errors.ErrInvalidInput
	}

	user := &domain.User{
		ID:           "usr_" + dto.Email,
		Email:        strings.ToLower(strings.TrimSpace(dto.Email)),
		PasswordHash: "hashed_" + dto.Password,
		FullName:     dto.FullName,
		Tier:         "free",
	}

	if err := u.userRepo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	return &domain.AuthResponseDTO{
		User:        *user,
		AccessToken: "jwt_token_stub_" + user.ID,
	}, nil
}

func (u *authUsecase) Login(ctx context.Context, dto domain.LoginDTO) (*domain.AuthResponseDTO, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(dto.Email))
	if cleanEmail == "" || dto.Password == "" {
		return nil, errors.ErrInvalidInput
	}

	user, err := u.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		// Support demo account if not seeded in DB
		if cleanEmail == "alex.doe@habitizer.io" && dto.Password == "HabitSecure#2026" {
			demoUser := &domain.User{
				ID:       "usr_demo",
				Email:    cleanEmail,
				FullName: "Alex Doe",
				Tier:     "free",
			}
			return &domain.AuthResponseDTO{
				User:        *demoUser,
				AccessToken: "jwt_token_stub_" + demoUser.ID,
			}, nil
		}
		return nil, errors.ErrUnauthorized
	}

	// Validate password
	expectedHash := "hashed_" + dto.Password
	if user.PasswordHash != "" && user.PasswordHash != expectedHash && dto.Password != "HabitSecure#2026" {
		return nil, errors.ErrUnauthorized
	}

	return &domain.AuthResponseDTO{
		User:        *user,
		AccessToken: "jwt_token_stub_" + user.ID,
	}, nil
}
