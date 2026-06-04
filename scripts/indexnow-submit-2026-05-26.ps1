# IndexNow -- Moteurs.com -- 21 URLs nouvelles (livrees 18/05-21/05/2026)
#
# Pages signalees :
#   * /assistant-depannage (+ /voyants)   = scan voyant par photo, catalogue
#   * /constat                            = constat amiable intelligent
#   * /outils/cartes-recharge             = comparateur 15 cartes VE
#   * /outils/cartes-recharge/[carte_id]  = 15 pages detail par carte
#   * /outils/documents-europe            = outils documents Europe
#   * /sitemap.xml                        = resoumission du sitemap apres MAJ
#
# IndexNow notifie Bing + Yandex en une seule requete.
# A executer depuis PowerShell apres le redeploy Vercel.

$payload = Get-Content -Raw "$PSScriptRoot\indexnow-payload-2026-05-26.json"

Write-Host "-> Notification IndexNow (Bing + Yandex)..." -ForegroundColor Cyan
$response = Invoke-WebRequest `
    -Uri "https://api.indexnow.org/IndexNow" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $payload `
    -UseBasicParsing

if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 202) {
    Write-Host "OK IndexNow -- code HTTP $($response.StatusCode)" -ForegroundColor Green
} else {
    Write-Host "Code inattendu : $($response.StatusCode)" -ForegroundColor Yellow
    Write-Host $response.Content
}

Write-Host ""
Write-Host "-> Notification Bing (endpoint dedie)..." -ForegroundColor Cyan
try {
    $bing = Invoke-WebRequest `
        -Uri "https://www.bing.com/indexnow" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body $payload `
        -UseBasicParsing -ErrorAction Stop
    Write-Host "OK Bing -- code HTTP $($bing.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Bing endpoint a renvoye : $($_.Exception.Message) (non bloquant -- api.indexnow.org propage deja a Bing)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Termine. Verifier les logs Bing Webmaster Tools sous 24-48h." -ForegroundColor Cyan
