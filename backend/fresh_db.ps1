# Stop Django (Ctrl+C) first, then run: .\fresh_db.ps1
Set-Location $PSScriptRoot
if (Test-Path db.sqlite3) {
  Remove-Item db.sqlite3 -Force
  Write-Host "Removed db.sqlite3"
} else {
  Write-Host "No db.sqlite3 to remove"
}
python manage.py migrate --noinput
Write-Host "Done. Start API with: .\run_dev.ps1"
