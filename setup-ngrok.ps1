# --- ZING NGROK AUTO-SETUP (v4.1) ---
# Automates downloading the "Outsourced SSL" portal.

$zipUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$zipFile = Join-Path $PWD "ngrok.zip"
$exeFile = Join-Path $PWD "ngrok.exe"

if (Test-Path $exeFile) {
    Write-Host "--- ngrok is already present! ---" -ForegroundColor Green
    return
}

Write-Host "Downloading ngrok (Outsourced SSL Portal)..." -ForegroundColor Gray
Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile

Write-Host "Unzipping ngrok..." -ForegroundColor Gray
Expand-Archive -Path $zipFile -DestinationPath $PWD -Force

Write-Host "Cleaning up zip..." -ForegroundColor Gray
Remove-Item $zipFile

if (Test-Path $exeFile) {
    Write-Host "[Success] ngrok is now ready in your folder." -ForegroundColor Green
} else {
    Write-Host "[Failure] Could not set up ngrok." -ForegroundColor Red
}
