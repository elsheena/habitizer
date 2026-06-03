package usecase

import (
	"context"

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
		Email:        dto.Email,
		PasswordHash: "hashed_" + dto.Password, // Demo stub
		FullName:     dto.FullName,
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
	user, err := u.userRepo.FindByEmail(ctx, dto.Email)
	if err != nil {
		return nil, errors.ErrUnauthorized
	}

	return &domain.AuthResponseDTO{
		User:        *user,
		AccessToken: "jwt_token_stub_" + user.ID,
	}, nil
}
