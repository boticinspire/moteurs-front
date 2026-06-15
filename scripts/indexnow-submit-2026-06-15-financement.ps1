# IndexNow - outil comparateur de financement (2026-06-15)
$ErrorActionPreference = 'Stop'
$key = '83dfd5cc3e064f91a86c12050835e52e'
$body = Get-Content -Raw -Path "$PSScriptRoot\indexnow-payload-2026-06-15-financement.json"
Write-Host 'Submitting to api.indexnow.org ...'
Invoke-RestMethod -Uri 'https://api.indexnow.org/IndexNow' -Method Post -ContentType 'application/json; charset=utf-8' -Body $body
Write-Host 'Submitting to www.bing.com/indexnow ...'
Invoke-RestMethod -Uri 'https://www.bing.com/indexnow' -Method Post -ContentType 'application/json; charset=utf-8' -Body $body
Write-Host 'Done.'
