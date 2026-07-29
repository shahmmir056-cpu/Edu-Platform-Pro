Write-Host "Starting Neural Sync..." -ForegroundColor Cyan

# Kill old processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start API server
Write-Host "Starting API server on port 8080..." -ForegroundColor Yellow
$apiJob = Start-Process -FilePath "node" -ArgumentList "--enable-source-maps", "$PSScriptRoot\artifacts\api-server\dist\index.mjs" -WorkingDirectory "$PSScriptRoot\artifacts\api-server" -PassThru -WindowStyle Hidden -RedirectStandardOutput "$PSScriptRoot\api.log" -RedirectStandardError "$PSScriptRoot\api-err.log"
$apiJob | Out-Null

# Set env vars for Vite
$env:PORT = "5000"
$env:BASE_PATH = "/"

# Start Vite frontend
Write-Host "Starting frontend on port 5000..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\artifacts\ai-study-hub"
Start-Process -FilePath "npx" -ArgumentList "vite","--host","--port","5000" -WindowStyle Normal

Start-Sleep -Seconds 4

# Test both servers
$ok = $true
try { Invoke-RestMethod -Uri "http://localhost:8080/api/healthz" -Method GET -TimeoutSec 3 | Out-Null; Write-Host "[OK] API server running on http://localhost:8080" -ForegroundColor Green } catch { Write-Host "[FAIL] API server not running!" -ForegroundColor Red; $ok = $false }
try { Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 3 | Out-Null; Write-Host "[OK] Frontend running on http://localhost:5000" -ForegroundColor Green } catch { Write-Host "[FAIL] Frontend not running!" -ForegroundColor Red; $ok = $false }

if ($ok) {
    Write-Host ""
    Write-Host "Open http://localhost:5000 in your browser" -ForegroundColor Cyan
    Write-Host "Press any key to stop servers..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "Check the logs: api.log, api-err.log" -ForegroundColor Red
}
