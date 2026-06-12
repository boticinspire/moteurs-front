Write-Host "IndexNow - comparateur cartes recharge + pages passerelles (sans-abo, voyage-europe, flotte, FR, BE)" -ForegroundColor Cyan
$payload = Get-Content -Raw -Path "$PSScriptRoot\indexnow-payload-2026-06-12-cartes-comparatif.json"
try {
  $r = Invoke-RestMethod -Uri "https://api.indexnow.org/IndexNow" -Method Post -ContentType "application/json; charset=utf-8" -Body $payload
  Write-Host "OK - submitted to IndexNow (Bing + Yandex)" -ForegroundColor Green
} catch {
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
