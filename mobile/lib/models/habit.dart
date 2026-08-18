class Habit {
  final String id;
  final String badHabit;
  final String cueTrigger;
  final String replacementHabit;
  final String reward;
  final String frequency;
  final String scheduledTime;
  final String category;
  final bool isActive;

  Habit({
    required this.id,
    required this.badHabit,
    required this.cueTrigger,
    required this.replacementHabit,
    required this.reward,
    this.frequency = 'daily',
    this.scheduledTime = '22:30',
    this.category = 'Health & Diet',
    this.isActive = true,
  });

  factory Habit.fromJson(Map<String, dynamic> json) {
    return Habit(
      id: json['id'] ?? '',
      badHabit: json['bad_habit'] ?? '',
      cueTrigger: json['cue_trigger'] ?? '',
      replacementHabit: json['replacement_habit'] ?? '',
      reward: json['reward'] ?? '',
      frequency: json['frequency'] ?? 'daily',
      scheduledTime: json['scheduled_time'] ?? '22:30',
      category: json['category'] ?? 'General',
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bad_habit': badHabit,
      'cue_trigger': cueTrigger,
      'replacement_habit': replacementHabit,
      'reward': reward,
      'frequency': frequency,
      'scheduled_time': scheduledTime,
      'category': category,
      'is_active': isActive,
    };
  }
}

class CatalogItem {
  final String id;
  final String category;
  final String title;
  final String description;
  final String icon;

  CatalogItem({
    required this.id,
    required this.category,
    required this.title,
    required this.description,
    this.icon = 'sparkles',
  });
}
