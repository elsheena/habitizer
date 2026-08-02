import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/habit.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  const DashboardScreen({Key? key, required this.onNavigateTab}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Habit> habits = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  void loadData() async {
    final list = await ApiService.getHabits();
    setState(() {
      habits = list;
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Habitizer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => widget.onNavigateTab(5), // About Us
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => loadData(),
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Welcome Header
            const Text(
              'Welcome to Habitizer',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              'Replace bad habits with healthy daily routines.',
              style: TextStyle(fontSize: 14, color: isDark ? Colors.white70 : Colors.black54),
            ),
            const SizedBox(height: 16),

            // Aristotle & Duhigg Quotes Cards
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '"We are what we repeatedly do. Excellence, then, is not an act, but a habit."',
                      style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '— Aristotle',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '"You cannot erase a bad habit; you can only change it by retaining the old cue and reward, while inserting a new routine."',
                      style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '— Charles Duhigg, The Power of Habit',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quick Stats Row
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('CLEAN STREAK', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text('${ApiService.streakInfo.currentStreak} Days', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: primaryColor)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SHOP COINS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Text('${ApiService.economyInfo.currencyBalance} pts', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.amber)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Active Habits Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('My Active Habits', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => widget.onNavigateTab(4), // New Habit
                  child: const Text('Add Habit'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Habits List
            if (isLoading)
              const Center(child: CircularProgressIndicator())
            else if (habits.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: Center(child: Text('No active habits yet. Tap Add Habit to start!')),
                ),
              )
            else
              ...habits.map((habit) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: primaryColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(habit.category, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor)),
                          ),
                          Text('${habit.scheduledTime} (${habit.frequency})', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(habit.badHabit, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.black26 : Colors.black.withOpacity(0.04),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Trigger: ${habit.cueTrigger}', style: const TextStyle(fontSize: 12)),
                            const SizedBox(height: 4),
                            Text('↳ Routine: ${habit.replacementHabit}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: primaryColor)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )).toList(),
          ],
        ),
      ),
    );
  }
}
