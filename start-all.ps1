# Script pour démarrer tous les serveurs (Next.js + Upload Server)
# Usage: .\start-all.ps1

Write-Host "🚀 Démarrage de tous les serveurs..." -ForegroundColor Green

# Vérifier que nous sommes dans le bon répertoire
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptPath

# Créer le dossier de logs s'il n'existe pas
$logsDir = ".\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Démarrer le serveur d'upload
Write-Host "📤 Démarrage du serveur d'upload sur le port 4000..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run upload-server" -WindowStyle Normal

Start-Sleep -Seconds 3

# Démarrer le serveur Next.js
Write-Host "🌐 Démarrage du serveur Next.js sur le port 3000..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "✅ Tous les serveurs sont en cours de démarrage..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 Accédez à l'application sur: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📤 Serveur d'upload sur: http://localhost:4000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Assurez-vous que les variables d'environnement sont correctement configurées dans .env" -ForegroundColor Yellow

Pop-Location
