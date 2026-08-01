import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'screens/auth_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/calendar_screen.dart';
import 'screens/shop_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/create_habit_screen.dart';
import 'screens/checkin_screen.dart';

void main() {
  runApp(const HabitizerMobileApp());
}

class HabitizerMobileApp extends StatefulWidget {
  const HabitizerMobileApp({super.key});

  @override
  State<HabitizerMobileApp> createState() => _HabitizerMobileAppState();
}

class _HabitizerMobileAppState extends State<HabitizerMobileApp> {
  bool isDark = false;

  void toggleTheme() {
    setState(() {
      isDark = !isDark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Habitizer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      home: MainNavigationShell(onToggleTheme: toggleTheme, isDark: isDark),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  final VoidCallback onToggleTheme;
  final bool isDark;

  const MainNavigationShell({
    super.key,
    required this.onToggleTheme,
    required this.isDark,
  });

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (!ApiService.isAuthenticated) {
      return AuthScreen(
        onAuthSuccess: () {
          setState(() {});
        },
      );
    }

    final screens = [
      DashboardScreen(
        onOpenCreate: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CreateHabitScreen()),
          );
          setState(() {});
        },
        onOpenCheckIn: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const CheckInScreen()),
          );
          setState(() {});
        },
      ),
      const CalendarScreen(),
      const ShopScreen(),
      ProfileScreen(
        onLogout: () {
          ApiService.logout();
          setState(() {});
        },
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Calendar',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_bag_outlined),
            selectedIcon: Icon(Icons.shopping_bag),
            label: 'Shop',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton(
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const CreateHabitScreen()),
                );
                setState(() {});
              },
              backgroundColor: AppTheme.bluePrimary,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }
}
