import 'package:flutter/material.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Habit Calendar')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('August 2026', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Chip(label: Text('Month View', style: TextStyle(fontSize: 11))),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Simple 7-column header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: const [
                      Text('S', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('M', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('T', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('W', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('T', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('F', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                      Text('S', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                    ],
                  ),
                  const Divider(height: 20),

                  // Calendar Grid Sample
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      childAspectRatio: 1.0,
                    ),
                    itemCount: 31,
                    itemBuilder: (context, index) {
                      final day = index + 1;
                      final isToday = day == 28;
                      final isClean = day < 28 && day != 12 && day != 20;

                      return Container(
                        margin: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: isToday
                              ? primaryColor.withOpacity(0.2)
                              : (isClean ? primaryColor.withOpacity(0.08) : Colors.transparent),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isToday ? primaryColor : (isClean ? primaryColor.withOpacity(0.3) : Colors.transparent),
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '$day',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                              color: isToday ? primaryColor : (isClean ? primaryColor : null),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Legend Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Row(
                    children: [
                      Container(width: 12, height: 12, decoration: BoxDecoration(color: primaryColor, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      const Text('Substituted', style: TextStyle(fontSize: 12)),
                    ],
                  ),
                  Row(
                    children: [
                      Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.amber, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      const Text('Freeze Used', style: TextStyle(fontSize: 12)),
                    ],
                  ),
                  Row(
                    children: [
                      Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.blueAccent, shape: BoxShape.circle)),
                      const SizedBox(width: 6),
                      const Text('Today', style: TextStyle(fontSize: 12)),
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
}
