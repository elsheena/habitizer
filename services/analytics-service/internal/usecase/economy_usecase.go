package usecase

import (
	"context"
	"errors"

	"github.com/habitizer/services/analytics-service/internal/domain"
	"github.com/habitizer/services/analytics-service/internal/repository/postgres"
)

type EconomyUsecase interface {
	GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error)
	BuyStreakFreeze(ctx context.Context, dto domain.BuyStreakFreezeDTO) (*domain.UserEconomy, error)
	BuyStreakFreezeBundle(ctx context.Context, dto domain.BuyBundleDTO) (*domain.UserEconomy, error)
	RedeemReward(ctx context.Context, dto domain.RedeemRewardDTO) (*domain.UserEconomy, error)
}

type economyUsecase struct {
	repo postgres.AnalyticsRepository
}

func NewEconomyUsecase(repo postgres.AnalyticsRepository) EconomyUsecase {
	return &economyUsecase{repo: repo}
}

func (u *economyUsecase) GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error) {
	return u.repo.GetUserEconomy(ctx, userID)
}

func (u *economyUsecase) BuyStreakFreeze(ctx context.Context, dto domain.BuyStreakFreezeDTO) (*domain.UserEconomy, error) {
	eco, err := u.repo.GetUserEconomy(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	const streakFreezeCost = 50
	if eco.CurrencyBalance < streakFreezeCost {
		return nil, errors.New("insufficient currency balance to buy streak freeze")
	}

	eco.CurrencyBalance -= streakFreezeCost
	eco.StreakFreezesAvailable += 1

	if err := u.repo.UpdateUserEconomy(ctx, eco); err != nil {
		return nil, err
	}
	return eco, nil
}

func (u *economyUsecase) BuyStreakFreezeBundle(ctx context.Context, dto domain.BuyBundleDTO) (*domain.UserEconomy, error) {
	eco, err := u.repo.GetUserEconomy(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	const bundleCost = 120 // 3 freezes for 120 coins (discount from 150)
	if eco.CurrencyBalance < bundleCost {
		return nil, errors.New("insufficient currency balance to buy streak freeze bundle (120 coins required)")
	}

	eco.CurrencyBalance -= bundleCost
	eco.StreakFreezesAvailable += 3

	if err := u.repo.UpdateUserEconomy(ctx, eco); err != nil {
		return nil, err
	}
	return eco, nil
}

func (u *economyUsecase) RedeemReward(ctx context.Context, dto domain.RedeemRewardDTO) (*domain.UserEconomy, error) {
	eco, err := u.repo.GetUserEconomy(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	if dto.CurrencyCost <= 0 {
		dto.CurrencyCost = 30
	}

	if eco.CurrencyBalance < dto.CurrencyCost {
		return nil, errors.New("insufficient currency balance to redeem reward")
	}

	eco.CurrencyBalance -= dto.CurrencyCost
	if dto.RewardType == "screen_time_30m" {
		eco.TotalScreenTimeEarnedMins += 30
	} else {
		eco.TotalScreenTimeEarnedMins += 15
	}

	if err := u.repo.UpdateUserEconomy(ctx, eco); err != nil {
		return nil, err
	}
	return eco, nil
}
