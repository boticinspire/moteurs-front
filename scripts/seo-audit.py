"""
seo-audit.py — Moteurs.com SEO Keyword Coverage Auditor
Usage : python3 scripts/seo-audit.py
Output: seo-report.json
"""
import re, os, json
from pathlib import Path

ROOT     = Path(__file__).parent.parent
APP_I18N = ROOT / "app" / "[locale]"
APP_BASE = ROOT / "app"
MSG_FR   = ROOT / "messages" / "fr.json"

# Charge les clés de traduction FR
_i18n = {}
if MSG_FR.exists():
    raw = json.loads(MSG_FR.read_text(encoding="utf-8"))
    for ns, vals in raw.items():
        if isinstance(vals, dict):
            for k, v in vals.items():
                _i18n[f"{ns}.{k}"] = str(v)

KEYWORD_MAP = {
    "/":                    { "primary": "calculateur coût trajet voiture",        "secondary": ["comparateur voiture électrique","TCO voiture électrique","coût voiture électrique vs diesel"], "vol": 14500, "intent": "Commerciale" },
    "/comparer":            { "primary": "comparateur voiture électrique",          "secondary": ["TCO voiture électrique","coût voiture électrique vs diesel","comparatif diesel essence électrique"], "vol": 22000, "intent": "Commerciale" },
    "/comparer-trajet":     { "primary": "calculateur coût trajet voiture",        "secondary": ["coût trajet voiture électrique","comparateur coût trajet motorisation"], "vol": 9800, "intent": "Commerciale" },
    "/simulateur":          { "primary": "simulateur coût voiture",                "secondary": ["TCO voiture électrique","calculateur coût trajet voiture"], "vol": 9200, "intent": "Commerciale" },
    "/tco":                 { "primary": "TCO voiture électrique",                 "secondary": ["comparatif TCO motorisation","coût total de possession voiture"], "vol": 8500, "intent": "Informationnelle" },
    "/recharge-electrique": { "primary": "prix recharge voiture électrique",       "secondary": ["borne recharge rapide France","réseau recharge voiture électrique France"], "vol": 21000, "intent": "Informationnelle" },
    "/outils/cartes-recharge": { "primary": "meilleure carte recharge voiture électrique", "secondary": ["carte recharge interopérable Europe","IONITY tarif 2026"], "vol": 9800, "intent": "Commerciale" },
    "/depannage":           { "primary": "ZFE 2026",                               "secondary": ["Crit'Air ZFE","zone faibles émissions 2026","voyant tableau de bord signification"], "vol": 18000, "intent": "Informationnelle" },
    "/assistant-depannage": { "primary": "voyant tableau de bord signification",   "secondary": ["voyant rouge voiture","voyant orange moteur voiture que faire"], "vol": 24000, "intent": "Informationnelle" },
    "/constat":             { "primary": "constat amiable voiture",                "secondary": ["constat amiable remplir seul"], "vol": 31000, "intent": "Informationnelle" },
    "/b2b":                 { "primary": "gestion flotte électrique entreprise",   "secondary": ["TCO flotte véhicule électrique","conversion flotte électrique PME"], "vol": 6400, "intent": "Commerciale" },
    "/particulier":         { "primary": "aide achat voiture électrique 2026",     "secondary": ["bonus écologique 2026","leasing social voiture électrique 2026"], "vol": 19500, "intent": "Informationnelle" },
    "/articles":            { "primary": "décryptage transition énergétique transport", "secondary": ["ZFE 2026","bonus écologique 2026"], "vol": 5000, "intent": "Navigationnelle" },
    "/articles/fr":         { "primary": "bonus écologique voiture électrique 2026","secondary": ["prime conversion 2026","aide achat véhicule électrique 2026"], "vol": 28000, "intent": "Informationnelle" },
    "/articles/be":         { "primary": "déduction fiscale voiture électrique Belgique 2026","secondary": ["avantage toute nature voiture électrique Belgique"], "vol": 8400, "intent": "Informationnelle" },
    "/articles/ch":         { "primary": "aide cantonale voiture électrique Suisse","secondary": ["bonus voiture électrique canton"], "vol": 3600, "intent": "Informationnelle" },
    "/articles/ca":         { "primary": "incitatif fédéral véhicule zéro émission Canada","secondary": ["programme IZEV Canada 2026","roulez vert Québec 2026"], "vol": 4200, "intent": "Informationnelle" },
    "/vacances-voiture":    { "primary": "trajet vacances voiture électrique",     "secondary": ["vignette autoroute Suisse voiture électrique","autonomie voiture électrique trajet longue distance"], "vol": 11000, "intent": "Informationnelle" },
    "/trajet":              { "primary": "itinéraires vacances Europe voiture",    "secondary": ["coût trajet Paris Nice voiture","trajet vacances famille voiture électrique"], "vol": 7000, "intent": "Informationnelle" },
    "/outils/immatriculation-france":   { "primary": "immatriculation voiture étrangère France délai","secondary": ["carte grise voiture étrangère France"], "vol": 6800, "intent": "Informationnelle" },
    "/outils/immatriculation-belgique": { "primary": "certificat immatriculation Belgique voiture étrangère","secondary": [], "vol": 5200, "intent": "Informationnelle" },
    "/cout-voiture":        { "primary": "TCO voiture électrique vs diesel",       "secondary": ["coût possession voiture diesel France"], "vol": 6400, "intent": "Informationnelle" },
    "/documents-auto":      { "primary": "documents auto obligatoires voiture",    "secondary": ["permis international conduire","contrôle technique étranger"], "vol": 4500, "intent": "Informationnelle" },
}

# Titres/descriptions suggérés (pour injection ou rapport)
SUGGESTED_META = {
    "/":                    { "title": "Calculateur TCO & Coût de Trajet | Moteurs.com — France, Belgique, Suisse", "desc": "Comparez le coût total de votre voiture (diesel, essence, électrique) et calculez le coût de votre trajet en 30 secondes. Données 2026 triangulées." },
    "/comparer":            { "title": "Comparateur voiture électrique vs diesel vs essence — TCO 2026 | Moteurs.com", "desc": "Comparez diesel, essence, électrique, hybride et GNV sur 48 mois. Coût d'achat, énergie, entretien et aides 2026 inclus. 4 pays couverts." },
    "/comparer-trajet":     { "title": "Calculateur coût trajet voiture — électrique vs diesel | Moteurs.com", "desc": "Calculez le coût exact de votre trajet selon votre motorisation : péages, recharge, énergie. Badge meilleure motorisation inclus." },
    "/simulateur":          { "title": "Simulateur TCO voiture — Coût total sur mesure 2026 | Moteurs.com", "desc": "Personnalisez km/an, durée, pays et fiscalité pour calculer le coût total de possession de votre véhicule. Export PDF inclus." },
    "/tco":                 { "title": "Comparatifs TCO par segment — Voiture, VUL, Camion | Moteurs.com", "desc": "Tous les comparatifs TCO : voiture, camionnette, camion, moto, VAE. Par pays (France, Belgique, Suisse, Canada) et motorisation. 2026." },
    "/recharge-electrique": { "title": "Prix recharge voiture électrique & réseau bornes France 2026 | Moteurs.com", "desc": "Comparez les prix de recharge (kWh, abonnement, sans abo), le réseau de bornes rapides et les meilleures cartes recharge en France et Europe." },
    "/outils/cartes-recharge": { "title": "Meilleure carte recharge voiture électrique 2026 — Comparatif | Moteurs.com", "desc": "Comparez Chargemap, Freshmile, IONITY, Fastned, Electra : tarifs par pays, plans abonnement, roaming. Trouvez la carte la moins chère." },
    "/depannage":           { "title": "ZFE 2026 : Crit'Air, vignettes, alternatives | Guide Moteurs.com", "desc": "Tout sur les Zones à Faibles Émissions 2026 : Crit'Air obligatoire, villes concernées, aides remplacement, alternatives. France, Belgique, Suisse." },
    "/assistant-depannage": { "title": "Voyant tableau de bord : signification et que faire | Moteurs.com", "desc": "Identifiez chaque voyant (rouge, orange, vert) : diagnostic IA par photo, niveau d'urgence, puis-je rouler ? 75+ voyants couverts." },
    "/constat":             { "primary": "constat amiable voiture", "title": "Constat amiable voiture — Remplir seul, wizard guidé | Moteurs.com", "desc": "Remplissez votre constat amiable en 8 étapes : 17 cas d'accident standardisés, export PDF, envoi email. France, Belgique, Suisse, Canada." },
    "/b2b":                 { "title": "Gestion flotte électrique entreprise — TCO & Aides 2026 | Moteurs.com", "desc": "Calculez le TCO de votre flotte, comparez utilitaires électriques vs diesel, optimisez aides et déductibilité. PME, artisans, grandes flottes." },
    "/particulier":         { "title": "Aide achat voiture électrique 2026 : bonus, leasing social | Moteurs.com", "desc": "Bonus écologique, prime conversion, leasing social : toutes les aides pour particuliers pour acheter une voiture électrique en 2026." },
    "/articles/fr":         { "title": "Bonus écologique & aides voiture électrique France 2026 | Moteurs.com", "desc": "Décryptages TCO, ZFE, bonus écologique et prime conversion 2026 pour la France. Données triangulées, mises à jour régulièrement." },
    "/articles/be":         { "title": "Déduction fiscale voiture électrique Belgique 2026 | Moteurs.com", "desc": "Avantage en nature, cotisation CO2, déductibilité : tout sur la fiscalité voiture électrique en Belgique pour particuliers et entreprises." },
    "/articles/ch":         { "title": "Aide cantonale voiture électrique Suisse 2026 | Moteurs.com", "desc": "Subventions par canton (Genève, Vaud, Zurich...) pour l'achat d'un véhicule électrique ou hybride en Suisse. Guide mis à jour." },
    "/articles/ca":         { "title": "Incitatif fédéral véhicule zéro émission Canada — IZEV 2026 | Moteurs.com", "desc": "Programme IZEV, Roulez Vert Québec, aides provinciales : toutes les aides pour acheter une voiture électrique au Canada en 2026." },
    "/vacances-voiture":    { "title": "Trajet vacances voiture électrique — Coût, recharge, vignettes | Moteurs.com", "desc": "Planifiez vos vacances en voiture électrique : coût de trajet, bornes de recharge, vignettes autoroute Europe, autonomie réelle en été." },
    "/trajet":              { "title": "Itinéraires vacances Europe — Coût voiture & recharge | Moteurs.com", "desc": "25 grands itinéraires de vacances calculés : Paris-Nice, Belgique-Costa Brava, etc. Coût par motorisation, bornes, péages." },
    "/cout-voiture":        { "title": "TCO voiture électrique vs diesel — Coût total 2026 | Moteurs.com", "desc": "Calculez et comparez le coût total de possession d'une voiture électrique face au diesel et à l'essence sur 4 ans. France, Belgique, Suisse." },
    "/documents-auto":      { "title": "Documents auto obligatoires en voiture à l'étranger 2026 | Moteurs.com", "desc": "Permis international, carte grise, certificat de conformité, vignettes : tous les documents obligatoires selon le pays de destination." },
    "/outils/immatriculation-france": { "title": "Immatriculation voiture étrangère en France — Délais & démarches 2026 | Moteurs.com", "desc": "Comment immatriculer une voiture étrangère en France : délai légal, documents, coût carte grise, démarches en ligne." },
    "/outils/immatriculation-belgique": { "title": "Immatriculation voiture étrangère en Belgique 2026 | Moteurs.com", "desc": "Certificat d'immatriculation belge pour véhicule étranger : démarches DIV, documents requis, délais, coûts." },
}

def resolve_path(route: str):
    """Cherche le fichier page.tsx dans les deux arborescences."""
    part = route.lstrip("/") or "."
    candidates = [
        APP_I18N / part / "page.tsx",
        APP_BASE / part / "page.tsx",
        APP_I18N / "page.tsx" if route == "/" else None,
    ]
    for c in candidates:
        if c and c.exists():
            return c
    return None

def scan_page(route: str) -> dict:
    path = resolve_path(route)
    kw   = KEYWORD_MAP.get(route, {})
    sug  = SUGGESTED_META.get(route, {})

    result = {
        "route": route,
        "file": str(path.relative_to(ROOT)) if path else "MISSING",
        "exists": path is not None,
        "has_title": False, "has_description": False, "has_h1": False, "has_canonical": False,
        "uses_i18n": False,
        "title_text": "", "description_text": "",
        "primary_keyword_in_title": False, "primary_keyword_in_desc": False,
        "secondary_covered": 0,
        "score": 0, "gaps": [],
        "primary": kw.get("primary", ""),
        "vol": kw.get("vol", 0),
        "intent": kw.get("intent", ""),
        "suggested_title": sug.get("title", ""),
        "suggested_desc":  sug.get("desc", ""),
    }

    if not path:
        result["gaps"] = ["fichier page.tsx introuvable"]
        return result

    content = path.read_text(encoding="utf-8", errors="ignore")

    # Détection getStaticMetadata (injection automatique)
    if "getStaticMetadata" in content:
        route_in_call = re.search(r"getStaticMetadata\(.(/.+?).\)", content)
        if route_in_call:
            kr   = route_in_call.group(1)
            kd   = KEYWORD_MAP.get(kr, kw)
            sd   = SUGGESTED_META.get(kr, {})
            result["has_title"] = result["has_description"] = result["has_canonical"] = True
            result["primary_keyword_in_title"] = result["primary_keyword_in_desc"] = True
            result["title_text"]       = sd.get("title", kd.get("primary", ""))[:80]
            result["description_text"] = sd.get("desc",  "")[:120]
            result["secondary_covered"]= len(kd.get("secondary", []))
            result["score"] = 100
            return result

    content_lc = content.lower()

    # Détection i18n
    uses_i18n = "getTranslations" in content or "useTranslations" in content
    result["uses_i18n"] = uses_i18n

    if uses_i18n:
        # Chercher les namespaces utilisés pour les metadata
        ns_matches = re.findall(r"namespace:\s*['\"]([A-Za-z]+)['\"]", content)
        for ns in ns_matches:
            for key in [f"{ns}.meta_title", f"{ns}.title", f"{ns}.meta_description", f"{ns}.description"]:
                val = _i18n.get(key, "")
                if val:
                    if "title" in key.lower() and not result["has_title"]:
                        result["has_title"] = True
                        result["title_text"] = val[:80]
                    if "desc" in key.lower() and not result["has_description"]:
                        result["has_description"] = True
                        result["description_text"] = val[:120]
        # Fallback Meta global
        if not result["has_title"] and _i18n.get("Meta.title_default"):
            result["has_title"] = True
            result["title_text"] = _i18n["Meta.title_default"][:80]
        if not result["has_description"] and _i18n.get("Meta.description"):
            result["has_description"] = True
            result["description_text"] = _i18n["Meta.description"][:120]
    else:
        # Hardcodé
        title_m = re.search(r"title[:\s]+[`'\"]([^`'\"]{5,120})[`'\"]", content_lc)
        desc_m  = re.search(r"description[:\s]+[`'\"]([^`'\"]{10,250})[`'\"]", content_lc)
        result["has_title"]       = bool(title_m) and "introuvable" not in (title_m.group(1) if title_m else "")
        result["has_description"] = bool(desc_m)
        result["title_text"]       = title_m.group(1)[:80] if title_m else ""
        result["description_text"] = desc_m.group(1)[:120] if desc_m else ""

    result["has_h1"]        = bool(re.search(r"<h1[\s>]", content_lc))
    result["has_canonical"] = "canonical" in content_lc or "alternates" in content_lc

    # Keyword coverage
    primary    = kw.get("primary", "").lower()
    secondary  = [s.lower() for s in kw.get("secondary", [])]
    title_lc   = result["title_text"].lower()
    desc_lc    = result["description_text"].lower()

    if primary:
        result["primary_keyword_in_title"] = any(w in title_lc for w in primary.split()[:3])
        result["primary_keyword_in_desc"]  = any(w in desc_lc  for w in primary.split()[:3])
        result["secondary_covered"] = sum(1 for s in secondary if any(w in content_lc for w in s.split()[:3]))

    # Score /100
    score = 0
    if result["has_title"]:                    score += 20
    if result["has_description"]:              score += 20
    if result["has_h1"]:                       score += 15
    if result["has_canonical"]:                score += 10
    if result["primary_keyword_in_title"]:     score += 20
    if result["primary_keyword_in_desc"]:      score += 10
    if result["secondary_covered"] > 0:        score += 5
    result["score"] = score

    if not result["has_title"]:       result["gaps"].append("title manquant")
    if not result["has_description"]: result["gaps"].append("description manquante")
    if not result["has_h1"]:          result["gaps"].append("H1 manquant")
    if not result["has_canonical"]:   result["gaps"].append("canonical manquant")
    if primary and not result["primary_keyword_in_title"]: result["gaps"].append("keyword absent du title")
    if primary and not result["primary_keyword_in_desc"]:  result["gaps"].append("keyword absent de la description")

    return result

if __name__ == "__main__":
    report = [scan_page(r) for r in KEYWORD_MAP]
    report.sort(key=lambda x: x["score"])

    out = ROOT / "seo-report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    avg   = sum(r["score"] for r in report) / len(report)
    n_ok  = sum(1 for r in report if r["score"] >= 70)
    n_mid = sum(1 for r in report if 40 <= r["score"] < 70)
    n_ko  = sum(1 for r in report if r["score"] < 40)

    print(f"Score moyen : {avg:.0f}/100  |  ✅ {n_ok}  🟡 {n_mid}  🔴 {n_ko}")
    print(f"Rapport     : {out}\n")
    print("Pages prioritaires (score < 40):")
    for r in [x for x in report if x["score"] < 40][:10]:
        print(f"  {r['score']:3d}/100  {r['route']:<38}  {r['vol']:>6} req/mois  → {', '.join(r['gaps'][:2])}")
