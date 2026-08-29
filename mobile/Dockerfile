# Multi-stage Dockerfile for Habitizer Mobile Android APK Build
FROM ghcr.io/cirruslabs/flutter:3.47.2 AS build-env

WORKDIR /app

# Copy dependency configuration and pre-fetch packages
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy full mobile source tree
COPY . .

# Build Debug and Release Android APKs
RUN flutter build apk --debug
RUN flutter build apk --release

# Final minimal export stage
FROM scratch AS export
COPY --from=build-env /app/build/app/outputs/flutter-apk/app-debug.apk /app-debug.apk
COPY --from=build-env /app/build/app/outputs/flutter-apk/app-release.apk /app-release.apk
