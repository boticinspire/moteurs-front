# IndexNow — refonte outils Phase 2 (16/06/2026)
$payload = Get-Content -Raw -Path "$PSScriptRoot\indexnow-payload-2026-06-16-refonte-p2.json"
Write-Host "Envoi a api.indexnow.org..."
Invoke-RestMethod -Uri "https://api.indexnow.org/IndexNow" -Method Post -ContentType "application/json; charset=utf-8" -Body $payload
Write-Host "Envoi a bing..."
Invoke-RestMethod -Uri "https://www.bing.com/indexnow" -Method Post -ContentType "application/json; charset=utf-8" -Body $payload
Write-Host "Termine."
