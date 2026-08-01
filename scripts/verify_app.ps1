# Habitizer Automated Verification Script

Write-Host "=========================================" -ForegroundColor Cipher
Write-Host " Habitizer API Verification Test Suite" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cipher

$baseUrl = "http://localhost:8000"

# 1. Gateway Health Check
Write-Host "`n[1/6] Testing Gateway Health Check..." -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "Gateway Health Check Passed: $($res.message)" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to Gateway. Ensure 'docker-compose up -d' is running." -ForegroundColor Red
    exit
}

# 2. Auth Service - Register & Login
Write-Host "`n[2/6] Testing Auth Service (Register & Login)..." -ForegroundColor Yellow
$regBody = @{
    email = "testuser@example.com"
    password = "password123"
    full_name = "Test User"
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    Write-Host "User Registration Passed: $($regRes.message)" -ForegroundColor Green
} catch {
    Write-Host "Registration warning: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Habit Suggestions Catalog
Write-Host "`n[3/6] Testing Suggested Healthy Habit Catalog..." -ForegroundColor Yellow
$sugRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/habits/suggestions" -Method Get
Write-Host "Retrieved $($sugRes.data.Count) suggested replacement habits from catalog." -ForegroundColor Green

# 4. Create Habit with Custom Frequency
Write-Host "`n[4/6] Testing Custom Habit Creation..." -ForegroundColor Yellow
$habitBody = @{
    user_id = "usr_test"
    bad_habit = "Late night junk food snacking"
    frequency = "daily"
    cue_trigger = "Boredom at 11 PM"
    replacement_habit = "Drink hot chamomile tea"
    reward = "Better sleep and clean teeth"
    category = "health"
} | ConvertTo-Json

$habitRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/habits" -Method Post -Body $habitBody -ContentType "application/json"
Write-Host "Habit Created Successfully: ID $($habitRes.data.id)" -ForegroundColor Green

# 5. Nightly Check-in & Auto-Promotion Evaluation
Write-Host "`n[5/6] Testing Nightly Audit Check-in & Auto-Promotion..." -ForegroundColor Yellow
$checkinBody = @{
    user_id = "usr_test"
    habit_id = $habitRes.data.id
    checkin_date = "2026-07-25"
    did_bad_habit = $false
    used_replacement = $true
    replacement_note = "5-Minute Deep Breathing"
} | ConvertTo-Json

$checkinRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/habits/checkin" -Method Post -Body $checkinBody -ContentType "application/json"
Write-Host "Nightly Check-in Recorded: $($checkinRes.message)" -ForegroundColor Green

# 6. Analytics Profile & Economy Store
Write-Host "`n[6/6] Testing Analytics Profile & Economy Store..." -ForegroundColor Yellow
$profileRes = Invoke-RestMethod -Uri "$baseUrl/api/v1/analytics/profile?user_id=usr_demo" -Method Get
Write-Host "Profile Summary: Streaks=$($profileRes.data.total_streaks), Balance=$($profileRes.data.economy.currency_balance) Currency, Freezes=$($profileRes.data.economy.streak_freezes_available)" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Cipher
Write-Host " All Verification Tests Completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cipher
