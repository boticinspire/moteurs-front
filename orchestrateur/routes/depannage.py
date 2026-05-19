"""
Routes FastAPI — Assistant Dépannage
POST /depannage/scan-voyant : analyse photo tableau de bord via Claude Vision (Sonnet)
"""
import json
import logging
import re
from typing import Literal

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Schémas ──────────────────────────────────────────────────────────────────

class ScanVoyantRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class VoyantDiagnostic(BaseModel):
    voyant_nom:  str
    description: str
    urgence:     Literal["stop", "attention", "info"]
    peut_rouler: bool
    actions:     list[str]
    article_lien: str | None = None
    confiance:   Literal["haute", "moyenne", "faible"]


# ─── Prompt Claude Vision ──────────────────────────────────────────────────────

PROMPT_VISION = """Tu es un expert en mécanique automobile. Analyse cette photo du tableau de bord et identifie le(s) voyant(s) allumé(s).

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{
  "voyant_nom": "Nom court du voyant principal (ex: 'Voyant moteur', 'Pression huile', 'Température moteur', 'Batterie / Alternateur', 'Pression pneus (TPMS)', 'ABS', 'Airbag', 'Direction assistée', 'AdBlue', 'Filtre à particules (FAP)', 'Niveau carburant', 'Frein / liquide de frein', 'Service dû')",
  "description": "Explication claire en 2-3 phrases de ce que signifie ce voyant, accessible à un conducteur non-mécanicien",
  "urgence": "stop|attention|info",
  "peut_rouler": true|false,
  "actions": ["action concrète 1", "action 2", "..."],
  "confiance": "haute|moyenne|faible"
}

Règles urgence :
- stop     = DANGER IMMÉDIAT — garer et couper le moteur dès que possible (pression huile, surchauffe, frein)
- attention = intervenir sous 24-48h, éviter les longs trajets (moteur, batterie, ABS, airbag)
- info      = informatif, planifier une visite garage prochainement (service, AdBlue, TPMS)

Règles :
- peut_rouler = false si urgence est "stop", sinon true
- Maximum 4 actions, claires et ordonnées par priorité
- Sois rassurant et accessible pour un conducteur non-mécanicien
- Si tu ne distingues pas de voyant allumé ou si l'image n'est pas un tableau de bord automobile, mets confiance: "faible" et explique-le dans description"""


# ─── Mapping thématique → article Moteurs.com ─────────────────────────────────

def _article_lien(voyant_nom: str) -> str | None:
    """Tente de renvoyer un lien vers un article Moteurs.com pertinent."""
    nom = voyant_nom.lower()
    # Voyants liés à l'électrique / recharge
    if any(k in nom for k in ["batterie", "alternateur", "recharge", "électrique", "hybride"]):
        return "https://moteurs.com/articles?pays=fr"
    # Voyants AdBlue / FAP / diesel
    if any(k in nom for k in ["adblue", "uree", "fap", "particule", "diesel"]):
        return "https://moteurs.com/articles?pays=fr"
    return None


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/scan-voyant", response_model=VoyantDiagnostic)
async def scan_voyant(req: ScanVoyantRequest):
    """
    Reçoit une image base64 du tableau de bord.
    Appelle Claude Vision (Sonnet) pour identifier les voyants allumés.
    Retourne un diagnostic structuré : nom, urgence, actions, lien article.
    """
    settings = get_settings()

    # ── Validation ────────────────────────────────────────────────────────────
    allowed_mimes = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    if req.mime_type not in allowed_mimes:
        raise HTTPException(
            status_code=400,
            detail=f"Type MIME non supporté: {req.mime_type}. Acceptés: {', '.join(allowed_mimes)}"
        )

    approx_bytes = len(req.image_base64) * 3 // 4
    if approx_bytes > 5 * 1024 * 1024:  # 5 Mo max
        raise HTTPException(status_code=413, detail="Image trop volumineuse (max 5 Mo)")

    # ── Appel Claude Vision ───────────────────────────────────────────────────
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": req.mime_type,
                            "data": req.image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": PROMPT_VISION,
                    },
                ],
            }],
        )
    except anthropic.APIError as e:
        logger.error(f"[scan-voyant] Anthropic API error: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur API Anthropic: {str(e)}")

    # ── Parsing JSON ──────────────────────────────────────────────────────────
    text = message.content[0].text if message.content else ""
    if not text:
        raise HTTPException(status_code=502, detail="Réponse vide de Claude Vision")

    cleaned = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"[scan-voyant] JSON invalide reçu: {cleaned[:300]}")
        raise HTTPException(status_code=502, detail=f"JSON invalide de Claude: {str(e)}")

    # ── Normalisation ─────────────────────────────────────────────────────────
    urgence = data.get("urgence", "attention")
    if urgence not in ("stop", "attention", "info"):
        urgence = "attention"

    confiance = data.get("confiance", "moyenne")
    if confiance not in ("haute", "moyenne", "faible"):
        confiance = "moyenne"

    voyant_nom = data.get("voyant_nom", "Voyant non identifié")

    return VoyantDiagnostic(
        voyant_nom=voyant_nom,
        description=data.get("description", ""),
        urgence=urgence,
        peut_rouler=data.get("peut_rouler", urgence != "stop"),
        actions=data.get("actions", [])[:4],
        article_lien=_article_lien(voyant_nom),
        confiance=confiance,
    )
