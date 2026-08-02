import 'package:flutter/material.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(title: const Text('About Us')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                children: [
                  Icon(Icons.spa, color: primaryColor, size: 40),
                  const SizedBox(height: 10),
                  const Text('About Habitizer', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Text(
                    'Replace unwanted coping habits with positive routines using behavioral neuroscience.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text('Our Guiding Quotes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

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
                  Text('— Aristotle', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor)),
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
                  Text('— Charles Duhigg, The Power of Habit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
