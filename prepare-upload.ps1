# --- ZING SENTINEL UPLOAD PREP (v7.2) ---
# Automatically Zips the necessary files for your 1-click cloud deployment.

$zipFile = Join-Path $PWD "zing-sentinel-CLOUD.zip"
$filesToZip = "index.html", "tracker.js", "config.js", "admin.html", "index.css", "connect.js"

if (Test-Path $zipFile) { Remove-Item $zipFile }

Write-Host "Creating your Security Deployment (Zip)..." -ForegroundColor Gray
Compress-Archive -Path $filesToZip -DestinationPath $zipFile

if (Test-Path $zipFile) {
    Write-Host "[Success] Your deployment zip is ready: zing-sentinel-CLOUD.zip" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening GitHub Upload Link..." -ForegroundColor Cyan
    Start-Process "https://github.com/new" # Fallback to new if they didn't give repo name
} else {
    Write-Host "[Error] Failed to create zip." -ForegroundColor Red
}
