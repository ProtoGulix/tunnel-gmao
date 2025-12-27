# Architecture Debt Check Script (PowerShell)
#
# Verifies that backend-specific code does not leak outside adapter boundaries.
# This script fails fast if any architectural violations are detected.
# 
# Usage:
#   .\scripts\arch-check.ps1
#   
# Exit codes:
#   0 - No violations found
#   1 - Architecture violations detected
# 
# Violations checked:
# 1. "directus" keyword outside src/lib/api/adapters
# 2. "axios" imports outside src/lib/api/client.js
# 3. "_raw" fields anywhere in src/ (backend leak)
# 4. Backend filters (_eq, _and, _or) outside adapters
# 
# Add this script to your CI pipeline to prevent architectural debt.

$ErrorActionPreference = "Continue"
$VIOLATIONS = 0

Write-Host ""
Write-Host "Architecture Debt Check" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""

# Check 1: "directus" outside adapters
Write-Host -NoNewline "Checking for 'directus' leaks outside adapters... "
$directusLeaks = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx |
Where-Object { $_.FullName -notmatch 'api\\adapters' } |
Select-String -Pattern "directus" -CaseSensitive:$false 2>$null

if ($directusLeaks) {
    Write-Host "FAIL" -ForegroundColor Red
    Write-Host "Found 'directus' references outside adapter directory:" -ForegroundColor Red
    $directusLeaks | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" }
    $VIOLATIONS++
}
else {
    Write-Host "OK" -ForegroundColor Green
}

# Check 2: "axios" imports outside client.js
Write-Host -NoNewline "Checking for 'axios' imports outside client.js... "
$axiosLeaks = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx |
Where-Object { $_.Name -ne 'client.js' -and $_.FullName -notmatch 'adapters' } |
Select-String -Pattern "import.*axios" 2>$null

if ($axiosLeaks) {
    Write-Host "FAIL" -ForegroundColor Red
    Write-Host "Found 'axios' imports outside client.js:" -ForegroundColor Red
    $axiosLeaks | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" }
    $VIOLATIONS++
}
else {
    Write-Host "OK" -ForegroundColor Green
}

# Check 3: "_raw" fields in source code
Write-Host -NoNewline "Checking for '_raw' backend fields... "
$rawLeaks = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx |
Select-String -Pattern "_raw" 2>$null

if ($rawLeaks) {
    Write-Host "FAIL" -ForegroundColor Red
    Write-Host "Found '_raw' backend fields in source:" -ForegroundColor Red
    $rawLeaks | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" }
    $VIOLATIONS++
}
else {
    Write-Host "OK" -ForegroundColor Green
}

# Check 4: Backend filters (_eq, _and, _or) outside adapters
Write-Host -NoNewline "Checking for backend filters outside adapters... "
$filterLeaks = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx |
Where-Object { $_.FullName -notmatch 'api\\adapters' } |
Select-String -Pattern "(_eq|_and|_or|_neq|_in|_nin)" 2>$null

if ($filterLeaks) {
    Write-Host "FAIL" -ForegroundColor Red
    Write-Host "Found backend-specific filters outside adapters:" -ForegroundColor Red
    $filterLeaks | ForEach-Object { Write-Host "  $($_.Path):$($_.LineNumber)" }
    $VIOLATIONS++
}
else {
    Write-Host "OK" -ForegroundColor Green
}

# Summary
Write-Host "================================"
if ($VIOLATIONS -eq 0) {
    Write-Host "All checks passed! Architecture is clean." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "Found $VIOLATIONS violation(s). Fix architecture leaks." -ForegroundColor Red
    Write-Host ""
    Write-Host "Tips:" -ForegroundColor Yellow
    Write-Host '  - Backend code must stay in src/lib/api/adapters'
    Write-Host '  - Use src/lib/api/facade for all API calls'
    Write-Host '  - Use normalizers from src/lib/api/normalizers'
    Write-Host '  - Never expose backend-specific details'
    exit 1
}
