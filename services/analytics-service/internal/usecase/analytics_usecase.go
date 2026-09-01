package usecase

import (
	"context"

	"github.com/habitizer/services/analytics-service/internal/domain"
	"github.com/habitizer/services/analytics-service/internal/repository/postgres"
)

type AnalyticsUsecase interface {
	StreakUsecase
	EconomyUsecase
	GetUserProfile(ctx context.Context, userID string) (*domain.UserProfileSummary, error)
}

type analyticsUsecase struct {
	repo    postgres.AnalyticsRepository
	streak  StreakUsecase
	economy EconomyUsecase
}

func NewAnalyticsUsecase(repo postgres.AnalyticsRepository) AnalyticsUsecase {
	return &analyticsUsecase{
		repo:    repo,
		streak:  NewStreakUsecase(repo),
		economy: NewEconomyUsecase(repo),
	}
}

func (u *analyticsUsecase) GetHabitStreak(ctx context.Context, habitID string) (*domain.HabitStreak, error) {
	return u.streak.GetHabitStreak(ctx, habitID)
}

func (u *analyticsUsecase) GetUserStreaks(ctx context.Context, userID string) ([]*domain.HabitStreak, error) {
	return u.streak.GetUserStreaks(ctx, userID)
}

func (u *analyticsUsecase) GetStreakSummary(ctx context.Context, userID string) (*domain.StreakSummaryDTO, error) {
	return u.streak.GetStreakSummary(ctx, userID)
}

func (u *analyticsUsecase) GetUserEconomy(ctx context.Context, userID string) (*domain.UserEconomy, error) {
	return u.economy.GetUserEconomy(ctx, userID)
}

func (u *analyticsUsecase) BuyStreakFreeze(ctx context.Context, dto domain.BuyStreakFreezeDTO) (*domain.UserEconomy, error) {
	return u.economy.BuyStreakFreeze(ctx, dto)
}

func (u *analyticsUsecase) BuyStreakFreezeBundle(ctx context.Context, dto domain.BuyBundleDTO) (*domain.UserEconomy, error) {
	return u.economy.BuyStreakFreezeBundle(ctx, dto)
}

func (u *analyticsUsecase) RedeemReward(ctx context.Context, dto domain.RedeemRewardDTO) (*domain.UserEconomy, error) {
	return u.economy.RedeemReward(ctx, dto)
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

	totalStreaks, longest, totalSubs, totalLogs := 0, 0, 0, 0
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
