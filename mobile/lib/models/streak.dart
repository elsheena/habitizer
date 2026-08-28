class StreakInfo {
  int currentStreak;
  int longestStreak;
  int totalSubstitutions;
  int totalRelapses;
  String successRate;

  StreakInfo({
    required this.currentStreak,
    required this.longestStreak,
    required this.totalSubstitutions,
    required this.totalRelapses,
    required this.successRate,
  });
}

class EconomyInfo {
  int currencyBalance;
  int streakFreezesAvailable;
  int totalScreenTimeEarnedMins;

  EconomyInfo({
    required this.currencyBalance,
    required this.streakFreezesAvailable,
    required this.totalScreenTimeEarnedMins,
  });
}
