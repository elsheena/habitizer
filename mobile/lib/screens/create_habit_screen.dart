import 'package:flutter/material.dart';
import '../models/habit.dart';
import '../services/api_service.dart';

class CreateHabitScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  const CreateHabitScreen({Key? key, required this.onNavigateTab}) : super(key: key);

  @override
  State<CreateHabitScreen> createState() => _CreateHabitScreenState();
}

class _CreateHabitScreenState extends State<CreateHabitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _badHabitController = TextEditingController();
  final _cueController = TextEditingController();
  final _routineController = TextEditingController();
  final _rewardController = TextEditingController();

  String _frequency = 'daily';
  String _category = 'Health & Diet';

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(title: const Text('New Habit Loop')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            const Text(
              '1. What habit do you want to replace?',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _badHabitController,
              decoration: InputDecoration(
                hintText: 'e.g. Late night snacking, doomscrolling',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Please enter a habit' : null,
            ),
            const SizedBox(height: 16),

            const Text(
              '2. What is the trigger (cue)?',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _cueController,
              decoration: InputDecoration(
                hintText: 'e.g. Stress after 10 PM, lying in bed',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
              validator: (v) => v == null || v.isEmpty ? 'Please enter a trigger' : null,
            ),
            const SizedBox(height: 16),

            const Text(
              '3. Healthy replacement routine:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _routineController,
              decoration: InputDecoration(
                hintText: 'e.g. Drink herbal tea, 5 min deep breathing',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              '4. Neuro-reward:',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _rewardController,
              decoration: InputDecoration(
                hintText: 'e.g. +10 Shop Coins & 15m screen time',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              style: ElevatedButton.styleButtonKey != null ? null : ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                if (_formKey.currentState!.validate()) {
                  final newHabit = Habit(
                    id: 'hab_${DateTime.now().millisecondsSinceEpoch}',
                    badHabit: _badHabitController.text.trim(),
                    cueTrigger: _cueController.text.trim(),
                    replacementHabit: _routineController.text.trim().isEmpty ? '5-Minute Deep Breathing' : _routineController.text.trim(),
                    reward: _rewardController.text.trim().isEmpty ? '+10 Shop Coins' : _rewardController.text.trim(),
                    frequency: _frequency,
                    category: _category,
                  );
                  await ApiService.addHabit(newHabit);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Habit loop created successfully!')),
                  );
                  widget.onNavigateTab(0); // Return to Dashboard
                }
              },
              child: const Text('Save Habit Loop', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
