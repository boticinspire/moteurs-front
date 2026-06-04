# IndexNow -- Moteurs.com -- nouvel outil ATN recharge domicile (BE) (livre 01/06/2026)
#
# Pages signalees :
#   * /outils/recharge-domicile-voiture-societe-belgique = calculateur ATN recharge domicile (BE)
#   * /outils                                             = hub outils (carte ajoutee)
#   * /recharge-electrique                                = hub recharge (lien ajoute)
#   * /sitemap.xml                                        = resoumission du sitemap apres MAJ
#
# Note : la page outil est protegee par auth cote client ; ses balises meta
# (title/description/canonical) restent rendues cote serveur et donc indexables.
#
# IndexNow notifie Bing + Yandex en une seule requete.
# A executer depuis PowerShell apres le redeploy Vercel.

$payload = Get-Content -Raw "$PSScriptRoot\indexnow-payload-2026-06-01.json"

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
