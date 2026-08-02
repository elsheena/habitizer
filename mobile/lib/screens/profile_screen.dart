import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Nightly Check-In Quick Card
          Card(
            color: primaryColor.withOpacity(0.08),
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                children: [
                  Icon(Icons.nightlight_round, color: primaryColor, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Nightly Habit Check-In', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('Audit today\'s habits and earn +10 coins.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (c) => AlertDialog(
                          title: const Text('Nightly Check-In'),
                          content: const Text('Did you avoid your bad habits today?'),
                          actions: [
                            TextButton(
                              onPressed: () {
                                Navigator.pop(c);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Relapse recorded. Streak Freeze evaluated!')),
                                );
                              },
                              child: const Text('Relapsed', style: TextStyle(color: Colors.red)),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                              onPressed: () {
                                Navigator.pop(c);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Clean day! +10 Coins awarded & Streak extended!')),
                                );
                              },
                              child: const Text('Yes, Avoided!', style: TextStyle(color: Colors.white)),
                            ),
                          ],
                        ),
                      );
                    },
                    child: const Text('Check-In', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // User Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: primaryColor.withOpacity(0.2),
                    child: Text('A', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: primaryColor)),
                  ),
                  const SizedBox(height: 10),
                  const Text('Alex Doe', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  const Text('alex.doe@habitizer.io', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  const SizedBox(height: 12),
                  Chip(
                    backgroundColor: primaryColor.withOpacity(0.12),
                    label: Text('Free Plan (3 Habits)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Performance Stats Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Habit Replacement Stats', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatItem('Longest Streak', '${ApiService.streakInfo.longestStreak}d', primaryColor),
                      _buildStatItem('Substituted', '${ApiService.streakInfo.totalSubstitutions}', primaryColor),
                      _buildStatItem('Success Rate', ApiService.streakInfo.successRate, primaryColor),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}
