# Spin up Habitizer Microservices concurrently headlessly
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   Spinning up Habitizer Go Microservice Ecosystem...   " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "Starting Auth Service (Port 8001)..." -ForegroundColor Cyan
Start-Process go -ArgumentList "run ./services/auth-service/cmd/main.go" -NoNewWindow

Write-Host "Starting Habit Service (Port 8002)..." -ForegroundColor Cyan
Start-Process go -ArgumentList "run ./services/habit-service/cmd/main.go" -NoNewWindow

Write-Host "Starting Analytics Service (Port 8003)..." -ForegroundColor Cyan
Start-Process go -ArgumentList "run ./services/analytics-service/cmd/main.go" -NoNewWindow

Write-Host "Starting Notification Worker Daemon..." -ForegroundColor Cyan
Start-Process go -ArgumentList "run ./services/notification-worker/cmd/main.go" -NoNewWindow

# Wait a few seconds for downstream services to initialize
Start-Sleep -Seconds 3

Write-Host "Starting API Gateway & Web Static Server (Port 8000)..." -ForegroundColor Cyan
Start-Process go -ArgumentList "run ./gateway/cmd/main.go" -NoNewWindow

Write-Host "--------------------------------------------------------" -ForegroundColor Green
Write-Host "All Habitizer microservices have been launched." -ForegroundColor Green
Write-Host "The platform can be accessed at: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Live Integration Tests at:       http://localhost:8000/tests" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Green
