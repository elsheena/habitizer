import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/habit.dart';
import '../models/streak.dart';

class UserModel {
  final String id;
  final String fullName;
  final String email;
  String tier;
  final String token;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.tier = 'free',
    required this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 'usr_demo_88',
      fullName: json['full_name'] ?? json['fullName'] ?? 'Alex Doe',
      email: json['email'] ?? 'alex.doe@habitizer.io',
      tier: json['tier'] ?? 'free',
      token: json['token'] ?? 'jwt_mock_token',
    );
  }
}

class ApiService {
  // Base URL for Go API Gateway:
  // Android Emulator: http://10.0.2.2:8000
  // Physical Device: http://<YOUR_LAN_IP>:8000
  static String baseUrl = 'http://10.0.2.2:8000';

  static UserModel? currentUser = UserModel(
    id: 'usr_demo_88',
    fullName: 'Alex Doe',
    email: 'alex.doe@habitizer.io',
    tier: 'free',
    token: 'mock_jwt_session_token',
  );

  static final List<Habit> _mockHabits = [
    Habit(
      id: 'hab_01',
      badHabit: 'Late night junk food snacking',
      cueTrigger: 'Stress or boredom after 10 PM',
      replacementHabit: 'Drink chamomile tea & 5 min breathing',
      reward: '10 Shop Coins',
      frequency: 'daily',
      scheduledTime: '22:30',
      category: 'Health & Diet',
    ),
    Habit(
      id: 'hab_02',
      badHabit: 'Endless social media scrolling in bed',
      cueTrigger: 'Lying in bed with phone in hand',
      replacementHabit: 'Read 5 pages of Kindle novel',
      reward: '10 Shop Coins',
      frequency: 'daily',
      scheduledTime: '23:00',
      category: 'Digital Wellbeing',
    ),
  ];

  static List<CatalogItem> catalog = [
    CatalogItem(id: '1', category: 'Mindfulness', title: '5-Minute Deep Breathing', description: 'Take 10 slow diaphragmatic breaths to calm cravings.'),
    CatalogItem(id: '2', category: 'Hydration', title: 'Drink a Glass of Cold Water', description: 'Cravings often disguise physiological thirst.'),
    CatalogItem(id: '3', category: 'Physical Action', title: 'Do 10 Push-ups or Stretch', description: 'Channel nervous energy into muscle contraction.'),
    CatalogItem(id: '4', category: 'Focus & Learning', title: 'Read 5 Pages of a Book', description: 'Divert mental focus to engaging literature.'),
    CatalogItem(id: '5', category: 'Relaxation', title: 'Herbal Chamomile Tea', description: 'Warm comforting tea to soothe evening stress.'),
  ];

  static StreakInfo streakInfo = StreakInfo(
    currentStreak: 14,
    longestStreak: 21,
    totalSubstitutions: 26,
    totalRelapses: 2,
    successRate: '92.8%',
  );

  static EconomyInfo economyInfo = EconomyInfo(
    currencyBalance: 150,
    streakFreezesAvailable: 2,
    totalScreenTimeEarnedMins: 45,
  );

  static bool get isAuthenticated => currentUser != null;

  static Future<UserModel> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/v1/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 2));

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        currentUser = UserModel.fromJson(data['user'] ?? data['data'] ?? {});
        return currentUser!;
      }
    } catch (_) {}

    // Fallback Mock Login
    final name = email.contains('@') ? email.split('@')[0] : 'User';
    currentUser = UserModel(
      id: 'usr_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      fullName: name[0].toUpperCase() + name.substring(1),
      email: email,
      tier: 'free',
      token: 'jwt_mock_${DateTime.now().millisecondsSinceEpoch}',
    );
    return currentUser!;
  }

  static Future<UserModel> register(String fullName, String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/v1/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'full_name': fullName, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 2));

      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = json.decode(res.body);
        currentUser = UserModel.fromJson(data['user'] ?? data['data'] ?? {});
        return currentUser!;
      }
    } catch (_) {}

    currentUser = UserModel(
      id: 'usr_${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      fullName: fullName,
      email: email,
      tier: 'free',
      token: 'jwt_mock_${DateTime.now().millisecondsSinceEpoch}',
    );
    return currentUser!;
  }

  static void logout() {
    currentUser = null;
  }

  static Future<List<Habit>> getHabits() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/v1/habits?user_id=${currentUser?.id ?? "usr_demo_88"}')).timeout(const Duration(seconds: 2));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['data'] != null && data['data'] is List) {
          return (data['data'] as List).map((h) => Habit.fromJson(h)).toList();
        }
      }
    } catch (_) {}
    return _mockHabits;
  }

  static Future<void> addHabit(Habit habit) async {
    _mockHabits.insert(0, habit);
    try {
      await http.post(
        Uri.parse('$baseUrl/api/v1/habits'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(habit.toJson()),
      ).timeout(const Duration(seconds: 2));
    } catch (_) {}
  }

  static Future<void> deleteHabit(String id) async {
    _mockHabits.removeWhere((h) => h.id == id);
    try {
      await http.delete(Uri.parse('$baseUrl/api/v1/habits?id=$id')).timeout(const Duration(seconds: 2));
    } catch (_) {}
  }

  static Future<void> checkin({required String habitId, required bool avoided, String? customRoutine}) async {
    if (avoided) {
      streakInfo.currentStreak += 1;
      streakInfo.totalSubstitutions += 1;
      economyInfo.currencyBalance += 10;
    } else {
      if (economyInfo.streakFreezesAvailable > 0) {
        economyInfo.streakFreezesAvailable -= 1;
      } else {
        streakInfo.currentStreak = 0;
      }
      streakInfo.totalRelapses += 1;
    }
  }

  static Future<void> buyFreeze() async {
    if (economyInfo.currencyBalance < 50) throw Exception('Insufficient coins');
    economyInfo.currencyBalance -= 50;
    economyInfo.streakFreezesAvailable += 1;
  }

  static Future<void> buyBundle() async {
    if (economyInfo.currencyBalance < 120) throw Exception('Insufficient coins');
    economyInfo.currencyBalance -= 120;
    economyInfo.streakFreezesAvailable += 3;
  }

  static Future<String> redeemPass(int minutes, int cost) async {
    if (economyInfo.currencyBalance < cost) throw Exception('Insufficient coins');
    economyInfo.currencyBalance -= cost;
    economyInfo.totalScreenTimeEarnedMins += minutes;
    return 'PASS-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
  }
}
