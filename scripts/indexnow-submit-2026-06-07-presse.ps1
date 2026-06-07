# IndexNow - soumission espace presse + charte editoriale (2026-06-07)
# Encodage: UTF-8 BOM + CRLF (PowerShell 5.1)
$ErrorActionPreference = "Stop"
$payload = Get-Content -Raw -Path "$PSScriptRoot\indexnow-payload-2026-06-07-presse.json"

Write-Host "Soumission IndexNow (api.indexnow.org)..."
Invoke-RestMethod -Uri "https://api.indexnow.org/IndexNow" -Method Post -ContentType "application/json; charset=utf-8" -Body $payload

Write-Host "Soumission IndexNow (bing.com)..."
Invoke-RestMethod -Uri "https://www.bing.com/indexnow" -Method Post -ContentType "application/json; charset=utf-8" -Body $payload

Write-Host "Termine."
