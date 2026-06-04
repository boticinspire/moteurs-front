"""
Routes FastAPI — Comparateur de modèles (avec cache Supabase)

POST /comparer-modeles/comparer
  - Vérifie le cache Supabase (table comparaisons_cache)
  - Cache hit  → retour immédiat + incrémente hit_count
  - Cache miss → appel Claude Haiku → stockage cache → retour

GET /comparer-modeles/cache/stats
  - Statistiques du cache (nb entrées, hit total, top combinaisons)
"""
import hashlib
import json
import logging
from typing import List

import anthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from config import get_settings
from database import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Modèles Pydantic ────────────────────────────────────────────────────────

class ComparerRequest(BaseModel):
    motorisation: str
    modeles: List[str]

    @field_validator("modeles")
    @classmethod
    def check_modeles(cls, v: List[str]) -> List[str]:
        cleaned = [m.strip() for m in v if m.strip()]
        if len(cleaned) < 2:
            raise ValueError("Minimum 2 modèles requis")
        return cleaned[:5]  # max 5

# ─── Cache key ───────────────────────────────────────────────────────────────

def make_cache_key(motorisation: str, modeles: List[str]) -> str:
    """SHA-256 déterministe : motorisation + modèles triés + normalisés en minuscules."""
    normalized = sorted(m.lower().strip() for m in modeles)
    raw = motorisation.lower().strip() + "|" + "|".join(normalized)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

# ─── Prompt Claude ───────────────────────────────────────────────────────────

def build_prompt(motorisation: str, modeles: List[str]) -> str:
    return f"""Tu es un expert automobile reconnu. Compare les {len(modeles)} véhicule(s) suivant(s), tous de motorisation "{motorisation}" :
{chr(10).join(f"{i+1}. {m}" for i, m in enumerate(modeles))}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte hors JSON :
{{
  "motorisation": "{motorisation}",
  "modeles": [
    {{
      "nom": "Nom normalisé : Marque Modèle Finition (ex: Tesla Model 3 Long Range)",
      "annee_modele": "2024",
      "specs": {{
        "prix_base": "Prix de base neuf (ex: 39 990 €)",
        "puissance": "Puissance max (ex: 204 ch / 150 kW)",
        "autonomie_wltp": "Autonomie WLTP si VE ou PHEV (ex: 580 km), sinon null",
        "consommation": "Consommation mixte (ex: 14.3 kWh/100km ou 5.2 L/100km)",
        "recharge_max_kw": "Puissance DC max en kW si VE/PHEV (ex: 170 kW), sinon null",
        "capacite_batterie_kwh": "Capacité batterie si VE/PHEV (ex: 75 kWh), sinon null",
        "coffre_litres": "Volume coffre en litres (ex: 440 L)",
        "longueur_mm": "Longueur hors-tout (ex: 4694 mm)",
        "poids_kg": "Poids à vide (ex: 1830 kg)",
        "garantie": "Garantie constructeur (ex: 8 ans / 160 000 km batterie)"
      }},
      "points_forts": [
        "Point fort 1 — précis et factuel (1 phrase courte)",
        "Point fort 2",
        "Point fort 3",
        "Point fort 4",
        "Point fort 5"
      ],
      "points_faibles": [
        "Point faible 1 — honnête et factuel (1 phrase courte)",
        "Point faible 2",
        "Point faible 3"
      ],
      "pour_qui": "Profil acheteur idéal en 1-2 phrases",
      "verdict": "Verdict équilibré en 2-3 phrases factuelles",
      "note_globale": 8.2
    }}
  ],
  "synthese": {{
    "meilleur_rapport_qp": "Nom exact du modèle avec le meilleur rapport qualité-prix",
    "meilleur_autonomie": "Nom exact du modèle avec la meilleure autonomie (null si non applicable)",
    "meilleur_recharge": "Nom exact du modèle avec la meilleure vitesse de recharge (null si non applicable)",
    "meilleur_espace": "Nom exact du modèle avec le plus d'espace / polyvalence",
    "conclusion": "Synthèse comparative en 3-4 phrases : différences clés, quel profil devrait choisir quel modèle"
  }}
}}

Règles strictes :
- Si un modèle n'existe pas ou n'est pas clairement identifiable, mets note_globale: 0 et explique dans verdict
- Données du millésime le plus récent disponible (2024 ou 2025)
- Pour les specs nullables : utiliser exactement null (pas de chaîne "null")
- Toutes les autres valeurs de specs sont des strings non vides
- note_globale : nombre décimal entre 0 et 10 avec une décimale
- Sois factuel, équilibré, sans favoritisme de marque"""

# ─── Route principale ─────────────────────────────────────────────────────────

@router.post("/comparer")
async def comparer_modeles(req: ComparerRequest):
    """
    Compare jusqu'à 5 modèles de même motorisation.
    Vérifie le cache Supabase avant d'appeler Claude Haiku.
    Retourne { ...résultat, cached: bool, cache_age_days: int|null }.
    """
    settings = get_settings()
    supabase = get_supabase()
    cache_key = make_cache_key(req.motorisation, req.modeles)

    # ── 1. Vérification du cache ──────────────────────────────────────────────
    try:
        cached = (
            supabase.table("comparaisons_cache")
            .select("id, result_json, created_at, hit_count")
            .eq("cache_key", cache_key)
            .maybe_single()
            .execute()
        )
        if cached.data:
            row = cached.data
            # Incrémenter hit_count en background (fire & forget)
            try:
                supabase.table("comparaisons_cache").update(
                    {"hit_count": row["hit_count"] + 1, "refreshed_at": "now()"}
                ).eq("id", row["id"]).execute()
            except Exception:
                pass

            from datetime import datetime, timezone
            created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            age_days = (datetime.now(timezone.utc) - created).days

            result = row["result_json"]
            result["cached"] = True
            result["cache_age_days"] = age_days
            logger.info(f"[comparaisons_cache] HIT {cache_key[:12]}… (hit #{row['hit_count']+1})")
            return result
    except Exception as e:
        logger.warning(f"[comparaisons_cache] erreur lecture cache: {e}")

    # ── 2. Appel Claude Haiku ─────────────────────────────────────────────────
    logger.info(f"[comparaisons_cache] MISS {cache_key[:12]}… — appel Claude Haiku")
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": build_prompt(req.motorisation, req.modeles)}],
        )
    except Exception as e:
        logger.error(f"[comparaisons_cache] erreur Claude: {e}")
        raise HTTPException(status_code=502, detail=f"Erreur Claude Haiku: {str(e)}")

    text = message.content[0].text if message.content else ""
    if not text:
        raise HTTPException(status_code=502, detail="Réponse vide de Claude")

    # Nettoyage markdown éventuel
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0].strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"[comparaisons_cache] JSON invalide: {cleaned[:200]}")
        raise HTTPException(status_code=502, detail=f"Réponse non analysable: {str(e)}")

    # ── 3. Stockage en cache ──────────────────────────────────────────────────
    try:
        supabase.table("comparaisons_cache").upsert(
            {
                "cache_key":    cache_key,
                "motorisation": req.motorisation,
                "modeles_json": req.modeles,
                "result_json":  result,
                "hit_count":    0,
            },
            on_conflict="cache_key",
        ).execute()
        logger.info(f"[comparaisons_cache] STORED {cache_key[:12]}…")
    except Exception as e:
        logger.warning(f"[comparaisons_cache] erreur écriture cache: {e}")

    result["cached"] = False
    result["cache_age_days"] = None
    return result


# ─── Stats cache ──────────────────────────────────────────────────────────────

@router.get("/cache/stats")
async def cache_stats():
    """Statistiques du cache comparaisons."""
    supabase = get_supabase()
    try:
        rows = (
            supabase.table("comparaisons_cache")
            .select("motorisation, modeles_json, hit_count, created_at")
            .order("hit_count", desc=True)
            .limit(20)
            .execute()
        )
        total = supabase.table("comparaisons_cache").select("id", count="exact").execute()
        return {
            "total_entrees": total.count,
            "top_comparaisons": rows.data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
