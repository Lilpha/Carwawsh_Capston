# One-shot: sync -> patch -> Metro -> build/install -> launch (Windows + C:\dev)
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\run-emulator.ps1
# Optional: -SkipBuild  (Metro + launch only, APK already installed)

param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$srcRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$devRoot = "C:\dev\Carwawsh_Capston"
$devFrontend = Join-Path $devRoot "frontend"
$metroPort = 8081

function Stop-PortListener([int]$Port) {
  $lines = netstat -ano | Select-String ":$Port\s"
  foreach ($line in $lines) {
    if ($line -match "LISTENING\s+(\d+)") {
      $pid = [int]$Matches[1]
      if ($pid -gt 0) {
        Write-Host ">> Kill PID $pid on port $Port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
      }
    }
  }
  Start-Sleep -Seconds 2
}

function Wait-MetroReady([int]$Port, [int]$TimeoutSec = 300) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $code = (curl.exe -s -o NUL -w "%{http_code}" "http://127.0.0.1:$Port/status" 2>$null)
      if ($code -eq "200") { return $true }
    } catch {}
    Start-Sleep -Seconds 2
  }
  return $false
}

function Wait-Device([int]$TimeoutSec = 120) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $out = adb devices 2>$null
    if ($out -match "emulator-\d+\s+device") { return $true }
    Start-Sleep -Seconds 3
  }
  return $false
}

Write-Host ">> Sync OneDrive -> $devRoot"
if (-not (Test-Path "C:\dev")) { New-Item -ItemType Directory -Path "C:\dev" | Out-Null }
robocopy $srcRoot $devRoot /MIR /XD node_modules "frontend\android\app\build" "frontend\android\build" "frontend\android\.gradle" .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

$srcEnv = Join-Path $srcRoot "frontend\.env"
$devEnv = Join-Path $devFrontend ".env"
if (Test-Path $srcEnv) {
  Copy-Item -LiteralPath $srcEnv -Destination $devEnv -Force
}

if (-not (Test-Path (Join-Path $devFrontend "node_modules"))) {
  Write-Host ">> npm install (first time on dev copy)..."
  Push-Location $devFrontend
  npm install
  Pop-Location
} else {
  Write-Host ">> patch-package"
  Push-Location $devFrontend
  npx patch-package
  Pop-Location
}

if (-not $SkipBuild) {
  Write-Host ">> Gradle installDebug (native rebuild for RN patch)..."
  foreach ($dir in @("android\build", "android\app\build", "android\.gradle")) {
    Remove-Item -LiteralPath (Join-Path $devFrontend $dir) -Recurse -Force -ErrorAction SilentlyContinue
  }
  # Stale autolinking.json with OneDrive paths breaks C:\dev builds.
  Remove-Item -LiteralPath (Join-Path $devFrontend "android\build\generated\autolinking") -Recurse -Force -ErrorAction SilentlyContinue
  Push-Location $devFrontend
  $env:REACT_NATIVE_APP_ROOT = $devFrontend
  Pop-Location
  Push-Location (Join-Path $devFrontend "android")
  .\gradlew --stop 2>$null | Out-Null
  .\gradlew :app:generateAutolinkingPackageList
  if ($LASTEXITCODE -ne 0) { throw "generateAutolinkingPackageList failed ($LASTEXITCODE)" }
  $autoJson = Join-Path $devFrontend "android\build\generated\autolinking\autolinking.json"
  if ((Test-Path $autoJson) -and (Get-Content $autoJson -Raw) -match "OneDrive") {
    throw "autolinking.json still points to OneDrive. Run this script from C:\dev only."
  }
  .\gradlew :app:installDebug -x lint
  if ($LASTEXITCODE -ne 0) { throw "Gradle installDebug failed ($LASTEXITCODE)" }
  Pop-Location
}

Write-Host ">> Stop old Metro on $metroPort"
Stop-PortListener $metroPort

Write-Host ">> Start Metro (background)"
$metroLog = Join-Path $env:TEMP "mapping-metro.log"
$metroErr = Join-Path $env:TEMP "mapping-metro.err.log"
$metroProc = Start-Process -FilePath "cmd.exe" -ArgumentList @(
  "/c", "cd /d `"$devFrontend`" && npm run start:clean > `"$metroLog`" 2> `"$metroErr`""
) -WindowStyle Hidden -PassThru

Write-Host ">> Wait for emulator device..."
if (-not (Wait-Device)) {
  Write-Host "WARN: No emulator detected. Start Medium Phone in Android Studio, then re-run with -SkipBuild"
}

Write-Host ">> Wait for Metro ready (up to 5 min)..."
if (-not (Wait-MetroReady $metroPort 300)) {
  Stop-Process -Id $metroProc.Id -Force -ErrorAction SilentlyContinue
  Get-Content $metroErr -Tail 40 -ErrorAction SilentlyContinue
  throw "Metro did not become ready. See $metroLog and $metroErr"
}

Write-Host ">> Warm JS bundle"
$bundleUrl = "http://127.0.0.1:$metroPort/index.bundle?platform=android&dev=true&lazy=true&minify=false&app=com.mapping&modulesOnly=false&runModule=true"
curl.exe -s -H "Accept: application/javascript" $bundleUrl -o NUL | Out-Null

adb reverse tcp:$metroPort tcp:$metroPort | Out-Null
adb shell am force-stop com.mapping | Out-Null
Start-Sleep -Seconds 1
adb shell am start -n com.mapping/.MainActivity | Out-Null

Write-Host ""
Write-Host "OK. Metro PID $($metroProc.Id) | log: $metroLog"
Write-Host "App launched. Expect Mapping login screen in ~15s."
Write-Host "Reload: adb shell input keyevent 82  (dev menu) or Metro terminal 'r'"
