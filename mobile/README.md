# Habitizer Mobile App (Flutter)

A cross-platform mobile app for Habitizer built with Flutter. It connects directly to the Go API Gateway and shares the same flat White/Light Blue and Dark/Dark Blue design without gradients.

## Features

- Welcome screen with habit philosophy quotes (Aristotle & Charles Duhigg).
- Habit list with triggers, healthy routines, and scheduled times.
- Calendar view with clean day tracking.
- Habit builder form for creating new substitution loops.
- Suggested routine catalog categorized into Mindfulness, Hydration, Movement, Focus, and Relaxation.
- Reward shop for streak freezes and screen time passes.
- Profile with nightly check-in dialog.

## How to Run

### 1. Set Backend IP
If you are testing on a physical phone, open `lib/services/api_service.dart` and set `baseUrl` to your computer's local Wi-Fi IP address:
```dart
static String baseUrl = 'http://192.168.1.100:8000';
```
For Android emulators, the default `http://10.0.2.2:8000` works automatically.

### 2. Run the App
```bash
flutter pub get
flutter run
```

### 3. Build Android APK
```bash
flutter build apk --release
```
The APK file will be placed in `build/app/outputs/flutter-apk/app-release.apk`.
