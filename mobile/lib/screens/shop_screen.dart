import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({Key? key}) : super(key: key);

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(title: const Text('Habitizer Shop')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Balance Card
          Card(
            color: primaryColor.withOpacity(0.08),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('MY COINS BALANCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(
                    '${ApiService.economyInfo.currencyBalance} Coins',
                    style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.amber),
                  ),
                  const SizedBox(height: 4),
                  const Text('Earn +10 coins every evening you replace a bad habit.', style: TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text('Streak Freezes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          Card(
            child: ListTile(
              leading: Icon(Icons.ac_unit, color: primaryColor, size: 30),
              title: const Text('1x Streak Freeze', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Protects your streak in case of a relapse.'),
              trailing: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                onPressed: () async {
                  try {
                    await ApiService.buyFreeze();
                    setState(() {});
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Purchased 1x Streak Freeze (-50 coins)')),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Not enough coins (Need 50)')),
                    );
                  }
                },
                child: const Text('50 pts', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
          const SizedBox(height: 16),

          const Text('Guilt-Free Rewards', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          Card(
            child: ListTile(
              leading: const Icon(Icons.sports_esports, color: Colors.indigo, size: 30),
              title: const Text('30-Min Free Time Pass', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Guilt-free gaming or leisure time.'),
              trailing: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: primaryColor),
                onPressed: () async {
                  try {
                    final pass = await ApiService.redeemPass(30, 60);
                    setState(() {});
                    showDialog(
                      context: context,
                      builder: (c) => AlertDialog(
                        title: const Text('Reward Pass Ready!'),
                        content: Text('Your code: $pass\nEnjoy 30 minutes of guilt-free free time!'),
                        actions: [TextButton(onPressed: () => Navigator.pop(c), child: const Text('Done'))],
                      ),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Not enough coins (Need 60)')),
                    );
                  }
                },
                child: const Text('60 pts', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
