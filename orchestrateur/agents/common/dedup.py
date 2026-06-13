"""
dedup.py — Moteurs.com / orchestrateur
=======================================
Déduplication des signaux de veille AVANT déclinaison par l'Agent Rédaction,
et choix de la portée de déclinaison (anti sur-déclinaison).

Adresse les DEUX causes de répétition observées le 11/06/2026 :

  1. CROSS-SOURCE / CROSS-LANGUE — le même événement scrapé depuis deux sources
     dans deux langues crée deux `veille_items` (ex. EN id 3991 + DE id 3987 pour
     le "Battery Booster UE 1,5 Md€"). Non dédupliqués, ils déclenchent deux
     fan-out de 6 articles → 12 articles quasi identiques. `find_duplicate()` les
     fusionne via le pivot `resume_ia` (rédigé en FR pour TOUTES les langues).

  2. SUR-DÉCLINAISON — une mesure UE sans angle national déclinée FR/BE/CH ×
     pro/particulier alors que les versions "particulier" sont interchangeables.
     `classify_signal()` recommande la portée réellement utile (souvent 1 seul
     article "mixte" pour une mesure industrielle européenne).

Stdlib uniquement. Les fonctions pures (tokenize / jaccard / find_duplicate /
classify_signal) n'ont AUCUNE dépendance et sont testables hors ligne. Les
wrappers DB (dedup_veille_item / is_recently_covered) sont des exemples à
adapter à votre couche d'accès (SDK supabase-py OU fetch direct PostgREST).
"""

from __future__ import annotations

import re
import unicodedata
import datetime as dt
from typing import Iterable, Optional


# -- Normalisation ------------------------------------------------------------

_STOP = {
    # FR
    "le", "la", "les", "des", "une", "un", "de", "du", "dans", "pour", "par",
    "sur", "avec", "que", "qui", "quoi", "est", "sont", "ont", "aux", "ces",
    "cette", "son", "ses", "leur", "vous", "nous", "plus", "sans", "entre",
    "vers", "chez", "mais", "donc", "car", "ainsi", "tout", "tous", "elle",
    "pas", "plusieurs", "apres", "annees", "cet",
    # EN
    "the", "and", "for", "with", "that", "this", "from", "will", "have", "has",
    "are", "was", "into", "over", "your", "you", "its", "their", "new",
    "launches", "launch", "official", "officially",
    # DE
    "der", "die", "das", "und", "fuer", "mit", "von", "den", "dem", "ein",
    "eine", "auf", "ist", "sind", "wird", "werden", "fur", "zur", "zum",
    "nicht", "auch", "noch", "schon",
}


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def tokenize(text: Optional[str]) -> set:
    """Sac de tokens normalisé : mots >= 4 lettres (hors stopwords) + nombres.

    Les nombres ("1,5", "1.5") sont conservés comme signature forte préfixée `#`
    (ex. "#1.5") — un montant partagé est un signal de doublon très discriminant.
    """
    if not text:
        return set()
    t = _strip_accents(text.lower())
    nums = {n.replace(",", ".") for n in re.findall(r"\d+[.,]?\d*", t)}
    words = re.findall(r"[a-z]{4,}", t)
    toks = {w for w in words if w not in _STOP}
    return toks | {"#" + n for n in nums}


def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    union = len(a | b)
    return len(a & b) / union if union else 0.0


def fingerprint(item: dict) -> set:
    """Signature multilingue d'un signal.

    On privilégie `resume_ia` car l'Agent Veille le rédige en FR quelle que soit
    la langue source -> c'est le pivot qui matche un signal EN avec son clone DE.
    Le titre (souvent dans la langue source) n'est ajouté que pour ses nombres
    et noms propres communs.
    """
    parts = [item.get("resume_ia") or "", item.get("titre") or ""]
    return tokenize(" ".join(parts))


# -- Détection de doublon (niveau veille) -------------------------------------

SIMILARITY_THRESHOLD = 0.42   # Jaccard sur resume_ia + titre normalisés
RECENCY_HOURS = 72

# Garde NIVEAU ARTICLE (cross-langue, fenetre longue) — backstop ajoute 2026-06-13.
# Utilise par is_recently_covered() appele dans l'Agent Redaction AVANT la fan-out.
# But : rattraper un MEME evenement capte via une autre source / un autre
# veille_item au titre different, couvert il y a plus de RECENCY_HOURS (72 h),
# que les gardes "titre exact" et "dedup veille 72 h" laissent passer.
# Comparaison faite sur resume_ia (FR) du signal vs titre+resume (FR) des articles
# -> robuste au cross-langue. Seuil un peu plus strict pour limiter les faux positifs
# sur des evenements distincts partageant du vocabulaire.
ARTICLE_COVERAGE_HOURS = 14 * 24      # 14 jours
ARTICLE_COVERAGE_THRESHOLD = 0.40


def find_duplicate(
    new_item: dict,
    recent_items: Iterable,
    threshold: float = SIMILARITY_THRESHOLD,
) -> Optional[dict]:
    """Retourne l'item récent le plus proche si similarité >= threshold, sinon None.

    `recent_items` = veille_items des dernières RECENCY_HOURS heures déjà
    TRAITE / EN_TRAITEMENT (donc déjà couverts par un article).
    """
    fp_new = fingerprint(new_item)
    best, best_score = None, 0.0
    for it in recent_items:
        if it.get("id") == new_item.get("id"):
            continue
        score = jaccard(fp_new, fingerprint(it))
        if score > best_score:
            best, best_score = it, score
    return best if best_score >= threshold else None


# -- Choix de la portée de déclinaison (anti sur-déclinaison) -----------------

# Indices d'un angle NATIONAL -> décliner par pays a du sens
_NATIONAL_HINTS = {
    "bonus", "prime", "conversion", "zfe", "crit", "critair", "lez",
    "suramortissement", "deductibilite", "deductible", "canton", "cantonal",
    "ofen", "finances", "wallonie", "flandre", "bruxelles", "quebec", "izev",
    "pave", "malus", "vignette", "ecotaxe", "fiscalite", "fiscal", "tva",
    "atn", "leasing", "immatriculation", "subvention", "aide", "aides",
}
# Indices d'une mesure UE / industrielle -> 1 article "mixte", pas de fan-out
_EU_HINTS = {
    "commission", "europeenne", "directive", "reglement", "gigafactory",
    "cellule", "cellules", "filiere", "industrie", "industrielle", "acea",
    "continent", "facility", "booster", "fabricants", "production",
}


def classify_signal(signal_text: str) -> dict:
    """Recommande la portée de déclinaison au lieu du fan-out systématique 3x2.

    Retour : {"scope", "pays": [...], "cibles": [...]}
      - "europeen" : mesure UE/industrielle sans levier conso direct
            -> 1 article mixte (pays "FR,BE,CH,CA"), cible "pro" uniquement.
      - "national" : aide/réglementation locale -> déclinaison ciblée.
    """
    toks = tokenize(signal_text)
    national = len(toks & _NATIONAL_HINTS)
    europeen = len(toks & _EU_HINTS)
    if europeen and national == 0:
        return {"scope": "europeen", "pays": ["FR,BE,CH,CA"], "cibles": ["pro"]}
    return {"scope": "national", "pays": ["FR", "BE", "CH"],
            "cibles": ["pro", "particulier"]}


# -- Wrappers DB (EXEMPLES — adapter à votre client) --------------------------

def _since_iso(hours: int) -> str:
    return (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=hours)).isoformat()


def dedup_veille_item(supabase, new_item: dict) -> Optional[dict]:
    """À appeler AVANT le fan-out de rédaction sur un item NOUVEAU.

    Si un doublon récent existe : marque le nouvel item `statut='IGNORE'`,
    le relie au même `article_id`, et retourne l'item d'origine (le caller
    doit alors SKIP la rédaction). Sinon retourne None.
    """
    resp = (
        supabase.table("veille_items")
        .select("id,titre,resume_ia,article_id,date_detection,statut")
        .gte("date_detection", _since_iso(RECENCY_HOURS))
        .in_("statut", ["TRAITE", "EN_TRAITEMENT"])
        .execute()
    )
    dup = find_duplicate(new_item, resp.data or [])
    if dup is not None:
        (
            supabase.table("veille_items")
            .update({"statut": "IGNORE", "article_id": dup.get("article_id")})
            .eq("id", new_item["id"])
            .execute()
        )
    return dup


def is_recently_covered(
    supabase, signal_text: str, hours: int = RECENCY_HOURS,
    threshold: float = SIMILARITY_THRESHOLD,
) -> bool:
    """Garde-fou rédaction : True si un article récent couvre déjà ce signal."""
    resp = (
        supabase.table("articles")
        .select("titre_provisoire,resume_50mots,created_at")
        .gte("created_at", _since_iso(hours))
        .in_("etat_code", ["PUBLIE", "EN_ATTENTE_VALIDATION"])
        .execute()
    )
    fp_sig = tokenize(signal_text)
    for a in (resp.data or []):
        fp_a = tokenize(f"{a.get('titre_provisoire', '')} {a.get('resume_50mots', '')}")
        if jaccard(fp_sig, fp_a) >= threshold:
            return True
    return False


# -- Garde anti-doublon EXACT (niveau article, AVANT insertion) ---------------
# Complète la dédup floue ci-dessus : empêche qu'un article au titre EXACTEMENT
# identique soit publié pour le MÊME (pays_cible, cible, langue). C'est ce trou
# qui avait laissé passer 66 doublons (cannibalisation), retirés le 2026-06-12.

def exact_title_key(titre: Optional[str]) -> str:
    """Clé normalisée d'un titre : minuscules, sans accents, alphanumérique only."""
    if not titre:
        return ""
    return re.sub(r"[^a-z0-9]", "", _strip_accents(titre.lower()))


def is_exact_duplicate(
    supabase, titre: str, pays_cible: str, cible: str, langue: str = "fr",
    etats: Iterable = ("PUBLIE", "EN_ATTENTE_VALIDATION", "VALIDE"),
) -> bool:
    """True si un article actif partage le MÊME titre normalisé + pays + cible + langue.

    À appeler AVANT l'insert d'une déclinaison. Respecte la stratégie géo
    (un même titre sur des pays différents reste autorisé) tout en bloquant les
    vrais doublons intra-pays.
    """
    key = exact_title_key(titre)
    if not key:
        return False
    resp = (
        supabase.table("articles")
        .select("titre_provisoire")
        .eq("pays_cible", pays_cible)
        .eq("cible", cible)
        .eq("langue", langue)
        .in_("etat_code", list(etats))
        .execute()
    )
    return any(exact_title_key(a.get("titre_provisoire", "")) == key for a in (resp.data or []))
