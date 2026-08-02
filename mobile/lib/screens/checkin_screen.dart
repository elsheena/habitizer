import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/habit.dart';
import '../theme/app_theme.dart';

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  List<Habit> habits = [];
  Habit? selectedHabit;
  bool? avoided;
  final _customRoutineCtrl = TextEditingController();
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHabits();
  }

  Future<void> _loadHabits() async {
    final list = await ApiService.getHabits();
    setState(() {
      habits = list;
      if (list.isNotEmpty) selectedHabit = list.first;
      isLoading = false;
    });
  }

  Future<void> _submit() async {
    if (selectedHabit == null || avoided == null) return;

    await ApiService.checkin(
      habitId: selectedHabit!.id,
      avoided: avoided!,
      customRoutine: _customRoutineCtrl.text.trim().isNotEmpty ? _customRoutineCtrl.text.trim() : null,
    );

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(avoided! ? 'Clean day recorded! +10 Coins earned.' : 'Check-in recorded. Streak protected with Freeze.'),
        backgroundColor: avoided! ? AppTheme.emeraldPrimary : AppTheme.rosePrimary,
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      appBar: AppBar(
        title: const Text('Nightly Check-In (21:00 Audit)'),
        backgroundColor: AppTheme.bgSurface,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.bgSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.nightlight_round, color: AppTheme.indigoPrimary, size: 24),
                  SizedBox(width: 10),
                  Text('Evening Habit Audit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 16),

              if (habits.isNotEmpty) ...[
                const Text('Which habit are you logging?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 8),
                DropdownButtonFormField<Habit>(
                  value: selectedHabit,
                  items: habits.map((h) => DropdownMenuItem(value: h, child: Text(h.badHabit, overflow: TextOverflow.ellipsis))).toList(),
                  onChanged: (val) => setState(() => selectedHabit = val),
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                ),
                const SizedBox(height: 20),

                const Text('Did you avoid the unwanted habit today?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => avoided = true),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: avoided == true ? AppTheme.emeraldSubtle : AppTheme.bgPrimary,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: avoided == true ? AppTheme.emeraldPrimary : AppTheme.borderSubtle,
                              width: 2,
                            ),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.shield_outlined, color: AppTheme.emeraldPrimary, size: 32),
                              SizedBox(height: 8),
                              Text('Yes, Avoided', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.emeraldPrimary)),
                              SizedBox(height: 4),
                              Text('+10 Coins', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() => avoided = false),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: avoided == false ? AppTheme.roseSubtle : AppTheme.bgPrimary,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: avoided == false ? AppTheme.rosePrimary : AppTheme.borderSubtle,
                              width: 2,
                            ),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.ac_unit, color: AppTheme.rosePrimary, size: 32),
                              SizedBox(height: 8),
                              Text('Had Relapse', style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.rosePrimary)),
                              SizedBox(height: 4),
                              Text('Freeze Protected', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                if (avoided == true) ...[
                  TextField(
                    controller: _customRoutineCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Custom replacement routine used (Optional)',
                      hintText: 'e.g. Chamomile tea & 10 breaths',
                      prefixIcon: Icon(Icons.psychology_outlined),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                ElevatedButton(
                  onPressed: avoided == null ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.bluePrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Confirm Nightly Check-In', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ] else ...[
                const Center(child: Text('No active habits to check in on. Create one first!')),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
