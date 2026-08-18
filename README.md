# Habitizer

Habitizer is my first pet project written in Go (Golang), built while learning the language following the advice of my supervisor. 

Instead of fighting bad habits with raw willpower, Habitizer is designed around the concept of **habit substitution** — keeping the original trigger and dopamine reward, but replacing the middle routine with a healthier alternative.

The project is inspired by:
- **Duolingo's streak & freeze mechanics**: Celebrating consecutive clean days, providing streak freeze safety nets, and unlocking earned leisure rewards.
- **Behavioral & philosophical habit principles**: Insights from Aristotle (*"We are what we repeatedly do"*) and Charles Duhigg (*The Power of Habit*).

---

## Architecture Overview

The backend is built with lightweight Go microservices and clean PostgreSQL schemas, alongside a responsive web interface and a Flutter mobile companion app:

- **gateway**: Main reverse proxy, static file server, and API router (`:8000`).
- **services/auth-service**: User registration, login, JWT issuance, and tier limits (`:8001`).
- **services/habit-service**: Habit substitution loops, suggested routine catalog, and 21:00 evening check-ins (`:8002`).
- **services/analytics-service**: Streak calculations, coins balance, and streak freeze store (`:8003`).
- **services/notification-worker**: Background worker for daily check-in alerts and smart calendar integration.
- **web**: Vanilla JavaScript frontend with modular UI components and dedicated per-page CSS (flat design, dark & light themes).
- **mobile**: Flutter companion app for mobile check-ins and quick reflection.

---

## Getting Started

### 1. Database Setup
Ensure PostgreSQL is running locally (`localhost:5432`), then run migrations:

```bash
go run ./scripts/migrate.go
```

This creates the `habitizer_db` database and its schemas (`auth_schema`, `habit_schema`, `analytics_schema`).

### 2. Run the Services
To launch all services together:

```powershell
.un_all.ps1
```

Or run the gateway directly:

```bash
go run ./gateway/cmd/main.go
```

Then visit:
- Web App: `http://localhost:8000`
- Integration Tests: `http://localhost:8000/tests`

### 3. Run Integration Tests
```bash
go run ./tests/IntegrationTests
```

---

## Running on Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```
