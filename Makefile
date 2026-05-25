.PHONY: help up down restart logs build test clean

help:
	@echo "Habitizer Microservices Commands:"
	@echo "  make up        - Start all microservices via Docker Compose"
	@echo "  make down      - Stop and remove all containers"
	@echo "  make restart   - Restart all microservices"
	@echo "  make logs      - View logs of running services"
	@echo "  make build     - Rebuild docker images"
	@echo "  make test      - Run Go tests across all microservices"

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

build:
	docker-compose build

test:
	@echo "Running tests..."
	@cd pkg && go test ./...
	@cd gateway && go test ./...
	@cd services/auth-service && go test ./...
	@cd services/habit-service && go test ./...
	@cd services/analytics-service && go test ./...
