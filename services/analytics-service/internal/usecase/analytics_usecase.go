package usecase

import (
	"context"
	"errors"

	"github.com/habitizer/services/analytics-service/internal/domain"
	"github.com/habitizer/services/analytics-service/internal/repository/postgres"
)

type AnalyticsUsecase interface {
	GetHabitStreak(ctx context.Context, habitID string) (*domain.HabitStreak, error)
	GetUserStreaks(ctx context.Context, userID string) ([]*domain.HabitStreak, error)
	GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error)
	BuyStreakFreeze(ctx context.Context, dto domain.BuyStreakFreezeDTO) (*domain.UserEconomy, error)
	RedeemReward(ctx context.Context, dto domain.RedeemRewardDTO) (*domain.UserEconomy, error)
	GetUserProfile(ctx context.Context, userID string) (*domain.UserProfileSummary, error)
}

type analyticsUsecase struct {
	repo postgres.AnalyticsRepository
}

func NewAnalyticsUsecase(repo postgres.AnalyticsRepository) AnalyticsUsecase {
	return &analyticsUsecase{repo: repo}
}

func (u *analyticsUsecase) GetHabitStreak(ctx context.Context, habitID string) (*domain.HabitStreak, error) {
	return u.repo.GetStreakByHabitID(ctx, habitID)
}

func (u *analyticsUsecase) GetUserStreaks(ctx context.Context, userID string) ([]*domain.HabitStreak, error) {
	return u.repo.GetStreaksByUserID(ctx, userID)
}

func (u *analyticsUsecase) GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error) {
	return u.repo.GetUserEconomy(ctx, userID)
}

func (u *analyticsUsecase) BuyStreakFreeze(ctx context.Context, dto domain.BuyStreakFreezeDTO) (*domain.UserEconomy, error) {
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

func (u *analyticsUsecase) RedeemReward(ctx context.Context, dto domain.RedeemRewardDTO) (*domain.UserEconomy, error) {
	eco, err := u.repo.GetUserEconomy(ctx, dto.UserID)
	if err != nil {
		return nil, err
	}

	if dto.CurrencyCost <= 0 {
		dto.CurrencyCost = 30 // Default cost
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

func (u *analyticsUsecase) GetUserProfile(ctx context.Context, userID string) (*domain.UserProfileSummary, error) {
	streaks, err := u.repo.GetStreaksByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	eco, err := u.repo.GetUserEconomy(ctx, userID)
	if err != nil {
		return nil, err
	}

	totalStreaks := 0
	longest := 0
	totalSubs := 0
	totalLogs := 0

	for _, s := range streaks {
		totalStreaks += s.CurrentStreak
		if s.LongestStreak > longest {
			longest = s.LongestStreak
		}
		totalSubs += s.TotalSubstitutions
		totalLogs += (s.TotalSubstitutions + s.TotalRelapses)
	}

	overallSuccess := 0.0
	if totalLogs > 0 {
		overallSuccess = (float64(totalSubs) / float64(totalLogs)) * 100.0
	}

	return &domain.UserProfileSummary{
		UserID:             userID,
		TotalStreaks:       totalStreaks,
		LongestStreak:      longest,
		OverallSuccessRate: overallSuccess,
		Economy:            eco,
	}, nil
}
