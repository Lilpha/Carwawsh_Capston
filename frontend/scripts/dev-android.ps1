# Windows + OneDrive 빌드 오류 우회: C:\dev 복사본에서 Android 빌드/설치
# 사용: frontend 폴더에서  powershell -ExecutionPolicy Bypass -File .\scripts\dev-android.ps1

$ErrorActionPreference = "Stop"
$srcRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$devRoot = "C:\dev\Carwawsh_Capston"

Write-Host ">> Sync to $devRoot (no node_modules)..."
if (-not (Test-Path "C:\dev")) { New-Item -ItemType Directory -Path "C:\dev" | Out-Null }
robocopy $srcRoot $devRoot /MIR /XD node_modules "frontend\android\app\build" "frontend\android\build" "frontend\android\.gradle" .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

$devFrontend = Join-Path $devRoot "frontend"
if (-not (Test-Path (Join-Path $devFrontend "node_modules"))) {
  Write-Host ">> npm install in dev copy..."
  Push-Location $devFrontend
  npm install
  Pop-Location
}

$envFile = Join-Path $devFrontend ".env"
$srcEnv = Join-Path $srcRoot "frontend\.env"
if ((Test-Path $srcEnv) -and -not (Test-Path $envFile)) {
  Copy-Item -LiteralPath $srcEnv -Destination $envFile
}

Write-Host ">> Remove stale autolinking + build dirs..."
Remove-Item -LiteralPath (Join-Path $devFrontend "android\build") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $devFrontend "android\app\build") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $devFrontend "android\.gradle") -Recurse -Force -ErrorAction SilentlyContinue

Push-Location (Join-Path $devFrontend "android")
.\gradlew --stop 2>$null
.\gradlew :app:generateAutolinkingPackageList
$autoJson = Join-Path $devFrontend "android\build\generated\autolinking\autolinking.json"
if ((Test-Path $autoJson) -and (Get-Content $autoJson -Raw) -match "OneDrive") {
  throw "autolinking.json still has OneDrive paths. Delete android\build and retry from C:\dev."
}
.\gradlew app:installDebug -x lint
Pop-Location

Write-Host ""
Write-Host "OK. Next:"
Write-Host "  cd C:\dev\Carwawsh_Capston\frontend"
Write-Host "  npm run start:clean"
Write-Host "  (emulator) open app or: adb shell am start -n com.mapping/.MainActivity"
