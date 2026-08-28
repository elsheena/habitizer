import 'package:flutter/material.dart';

class AppTheme {
  // Flat Colors (Zero Gradients)
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceElevated = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightBorderStrong = Color(0xFFCBD5E1);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);
  static const Color lightTextMuted = Color(0xFF94A3B8);

  static const Color darkBg = Color(0xFF1E293B);
  static const Color darkSurface = Color(0xFF2A3B50);
  static const Color darkSurfaceElevated = Color(0xFF334862);
  static const Color darkBorder = Color(0xFF3F5572);
  static const Color darkBorderStrong = Color(0xFF546E91);
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFFD6E2EE);
  static const Color darkTextMuted = Color(0xFF9CB2CB);

  // Global Brand & Accent Colors
  static const Color bluePrimary = Color(0xFF38BDF8);
  static const Color blueHover = Color(0xFF0EA5E9);
  static const Color blueSubtle = Color(0x3338BDF8);

  static const Color emeraldPrimary = Color(0xFF34D399);
  static const Color emeraldHover = Color(0xFF10B981);
  static const Color emeraldSubtle = Color(0x3334D399);

  static const Color indigoPrimary = Color(0xFFA5B4FC);
  static const Color indigoHover = Color(0xFF818CF8);
  static const Color indigoSubtle = Color(0x33A5B4FC);

  static const Color amberPrimary = Color(0xFFFBBF24);
  static const Color amberHover = Color(0xFFF59E0B);
  static const Color amberSubtle = Color(0x33FBBF24);

  static const Color rosePrimary = Color(0xFFFB7185);
  static const Color roseHover = Color(0xFFF43F5E);
  static const Color roseSubtle = Color(0x33FB7185);

  // Dynamic getters defaulting to active theme
  static Color get bgPrimary => darkBg;
  static Color get bgSurface => darkSurface;
  static Color get bgSurfaceElevated => darkSurfaceElevated;
  static Color get borderSubtle => darkBorder;
  static Color get borderStrong => darkBorderStrong;
  static Color get textPrimary => darkTextPrimary;
  static Color get textSecondary => darkTextSecondary;
  static Color get textMuted => darkTextMuted;

  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    scaffoldBackgroundColor: lightBg,
    primaryColor: const Color(0xFF0284C7),
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF0284C7),
      surface: lightSurface,
      onPrimary: Colors.white,
      onSurface: lightTextPrimary,
    ),
    cardTheme: CardThemeData(
      color: lightSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: lightBorder),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: lightSurface,
      elevation: 0,
      titleTextStyle: TextStyle(color: lightTextPrimary, fontSize: 18, fontWeight: FontWeight.bold),
      iconTheme: IconThemeData(color: lightTextPrimary),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: lightSurface,
      selectedItemColor: Color(0xFF0284C7),
      unselectedItemColor: lightTextSecondary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
  );

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: darkBg,
    primaryColor: bluePrimary,
    colorScheme: const ColorScheme.dark(
      primary: bluePrimary,
      surface: darkSurface,
      onPrimary: darkBg,
      onSurface: darkTextPrimary,
    ),
    cardTheme: CardThemeData(
      color: darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: const BorderSide(color: darkBorder),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: darkSurface,
      elevation: 0,
      titleTextStyle: TextStyle(color: darkTextPrimary, fontSize: 18, fontWeight: FontWeight.bold),
      iconTheme: IconThemeData(color: darkTextPrimary),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: darkSurface,
      selectedItemColor: bluePrimary,
      unselectedItemColor: darkTextSecondary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
  );
}
