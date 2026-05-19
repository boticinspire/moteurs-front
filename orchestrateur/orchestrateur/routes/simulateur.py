from fastapi import APIRouter
from fastapi.responses import JSONResponse, PlainTextResponse

from agents.simulateur.agent import (
    run_simulateur_update,
    _charger_depuis_supabase,
    generer_json_export,
)

router = APIRouter()


@router.get("/")
async def get_donnees_simulateur():
    """Retourne les données simulateur actuelles stockées en Supabase."""
    data = _charger_depuis_supabase()
    return data


@router.post("/mettre-a-jour")
async def mettre_a_jour_simulateur():
    """Déclenche un cycle de mise à jour : scraping + sauvegarde Supabase."""
    resultat = await run_simulateur_update()
    return {
        "status": "ok",
        "nb_changements": resultat["nb_changements"],
        "changements": resultat["changements"],
    }


@router.get("/export-json", response_class=PlainTextResponse)
async def exporter_json():
    """
    Génère et retourne le contenu de simulateur-data.json prêt à déployer.
    Le frontend admin télécharge ce fichier et le dépose dans data/.
    """
    data = _charger_depuis_supabase()
    json_str = generer_json_export(data)
    return PlainTextResponse(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=simulateur-data.json"},
    )
