# IndexNow submission - Comparateur voiture de societe (BE) - 2026-06-12
# Run from Windows PowerShell after the Vercel deployment is live.

$payloadPath = Join-Path $PSScriptRoot "indexnow-payload-2026-06-12-comparateur.json"
$payload = Get-Content -Raw -Path $payloadPath

Write-Host "Submitting URLs to IndexNow (api.indexnow.org)..."
Invoke-RestMethod -Method Post -Uri "https://api.indexnow.org/IndexNow" -ContentType "application/json; charset=utf-8" -Body $payload

Write-Host "Also notifying Bing endpoint (www.bing.com/indexnow)..."
Invoke-RestMethod -Method Post -Uri "https://www.bing.com/indexnow" -ContentType "application/json; charset=utf-8" -Body $payload

Write-Host "IndexNow submission complete."
