# Habitizer

Habitizer is my first pet project written in Go (Golang), built while learning the language following the advice of my supervisor.

Instead of fighting bad habits with raw willpower, Habitizer is designed around the concept of **habit substitution** — keeping the original trigger and dopamine reward, but replacing the middle routine with a healthier alternative.

The project is inspired by:
- **Duolingo's streak & freeze mechanics**: Celebrating consecutive clean days, providing streak freeze safety nets, and unlocking earned leisure rewards.
- **Behavioral & philosophical habit principles**: Insights from Aristotle (*"We are what we repeatedly do"*) and Charles Duhigg (*The Power of Habit*).

---

## Getting Started

### 1. Database Setup
Ensure PostgreSQL is running locally (`localhost:5432`), then run migrations:

```bash
go run ./scripts/migrate.go
```

### 2. Run the Services
```bash
go run ./gateway/cmd/main.go
```
