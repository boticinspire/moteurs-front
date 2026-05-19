"""
Catalogue des cartes de recharge — Moteurs.com
Toutes les sources à scraper ou maintenir manuellement.

Champs :
  id            identifiant unique snake_case
  nom           nom commercial affiché
  operateur     société émettrice
  pays_origine  liste ISO des pays où la carte est disponible à la souscription
  url_officielle  page d'accueil du produit
  url_tarifs      page tarifs à scraper (None = manuel uniquement)
  methode         "httpx" | "manuel"
                  httpx   → tentative de scraping + extraction Haiku
                  manuel  → données figées dans donnees_init (pas de scraping auto)
  ideal_voyage  true si réseau roaming EU significatif
  ideal_quotidien true si bon rapport pour usage domestique quotidien
  flotte_pro    true si offre dédiée flotte / facturation centralisée
  donnees_init  tarifs de départ renseignés manuellement (point de départ de la base)
                L'agent les remplace si le scraping réussit.
"""

CARTES: list[dict] = [

    # ── FRANCE ─────────────────────────────────────────────────────────────────

    {
        "id": "chargemap-pass",
        "nom": "Chargemap Pass",
        "operateur": "Chargemap",
        "pays_origine": ["FR", "BE", "CH", "DE", "NL"],
        "url_officielle": "https://chargemap.com/fr/pass",
        "url_tarifs": "https://chargemap.com/fr/pass/pricing",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": True,
        "flotte_pro": False,
        "points_forts": ["Plus grand réseau France", "Roaming 30+ pays EU", "App très complète"],
        "points_faibles": ["Tarif ultra-rapide élevé sans abonnement"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.39, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.52, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.72, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","NL","ES","IT","CH","PT","AT","LU","PL","GB","SE","NO"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.59},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.79},
            },
        },
    },

    {
        "id": "freshmile",
        "nom": "Freshmile",
        "operateur": "Freshmile",
        "pays_origine": ["FR", "BE", "DE", "NL"],
        "url_officielle": "https://freshmile.com",
        "url_tarifs": "https://freshmile.com/tarifs/",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": ["Agrégateur multi-réseaux", "API flotte", "Facturation centralisée"],
        "points_faibles": ["Interface moins intuitive que Chargemap"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.38, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.50, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.68, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","NL","AT","CH","ES","IT","LU"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.55},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.75},
            },
        },
    },

    {
        "id": "electra",
        "nom": "Electra",
        "operateur": "Electra",
        "pays_origine": ["FR", "BE", "DE", "ES", "IT", "NL", "AT", "CH", "LU"],
        "url_officielle": "https://fr.electra.charging",
        "url_tarifs": "https://intercom.help/go-electra/fr/articles/7987274-les-differents-tarifs-de-charge",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": [
            "Facturation au kWh réel (AC et DC — même tarif)",
            "Réseau ultra-rapide ≥150 kW en croissance rapide",
            "Stations urbaines premium + autoroute",
            "Tarif app compétitif (dès 0,39 €/kWh en France)",
        ],
        "points_faibles": [
            "Tarif dynamique en France : varie selon la station (0,39–0,61 €/kWh)",
            "Badge RFID peut avoir des frais supplémentaires",
            "Réseau encore limité hors grandes villes en zones rurales",
        ],
        "donnees_init": {
            # Sources croisées :
            #   (1) https://intercom.help/go-electra/fr/articles/7987274 — 02/03/2026
            #   (2) https://www.go-electra.com/en/price/ — mai 2026
            # Electra facture au kWh, sans distinction AC/DC (tarif unique par station).
            # L'abonnement Electra+ (sans engagement) économise jusqu'à 0,20 €/kWh.

            # Plan sans abonnement (App Electra / Autocharge)
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},

            # Plan Electra+ — sans engagement, économie jusqu'à 0,20 €/kWh
            "abonnement_plus": {
                "nom": "Electra+",
                "engagement_mois": 0,
                "economie_max_eur_kwh": 0.20,
                "_note": "1 mois offert avec le code PLUS2. Tarif réduit sur toutes les stations Electra.",
            },

            # ── France ──────────────────────────────────────────────────────────
            # Tarif dynamique selon occupation station — sources (1) et (2) concordent
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "_dynamique": True,
                "_plage_min": 0.39,
                "_plage_max": 0.61,
                "_tarif_cb_borne": 0.61,
                "_note": "Prix médian retenu (0,49). Autoroute : tarif supérieur affiché sur borne.",
            },

            # ── Belgique ─────────────────────────────────────────────────────────
            # Tarif dynamique — sources (1) et (2) concordent
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
                "_dynamique": True,
                "_plage_min": 0.54,
                "_plage_max": 0.75,
                "_tarif_cb_borne": 0.75,
            },

            # ── Suisse ───────────────────────────────────────────────────────────
            # Source (2) corrige source (1) : 0,64 CHF app (pas 0,59), 0,69 CHF CB (pas 0,64)
            "tarifs_ch": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.64, "frais_session": 0.0},
                "_tarif_cb_borne": 0.69,
                "_dynamique": False,
            },

            # ── Autres pays (tarif app sans abonnement) ──────────────────────────
            # Source principale : site go-electra.com/en/price — mai 2026
            "tarifs_par_pays": {
                "DE": {"prix_app": 0.54, "prix_cb": 0.69, "tva_pct": 19,  "dynamique": False},
                "AT": {"prix_app": 0.59, "prix_cb": 0.69, "tva_pct": 20,  "dynamique": False},
                "LU": {"prix_app": 0.49, "prix_cb": 0.59, "tva_pct": 17,  "dynamique": False},
                # Espagne : tarif dynamique confirmé FAQ site — source (2) corrige source (1)
                "ES": {"prix_app_min": 0.39, "prix_app_max": 0.59, "prix_cb": 0.59, "tva_pct": 21, "dynamique": True},
                # Italie : "à partir de 0,69" — tarif dynamique — source (2) corrige source (1)
                "IT": {"prix_app_min": 0.69, "prix_cb": 0.79, "tva_pct": 22, "dynamique": True},
            },

            # ── Roaming ──────────────────────────────────────────────────────────
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","ES","IT","AT","CH","LU"],
                # Pas de tarif roaming fixe : prix local du pays de la station via app
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.49},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.49},
                "_note": "Le tarif appliqué est celui du pays de la station (pas de surcoût roaming).",
            },

            # ── Frais de stationnement (info consommateur) ───────────────────────
            "_frais_stationnement": {
                "via_app": "0,40 €/min après 80% de charge si station saturée (grâce 5 min, plafond 50 €)",
                "via_badge_roaming": "0,40 €/min après 75 min de connexion (plafond 100 €)",
            },

            "_sources": [
                "Intercom Electra — 02/03/2026",
                "go-electra.com/en/price — mai 2026 (source prioritaire pour divergences)",
            ],
        },
    },

    {
        "id": "totalenergies-charge",
        "nom": "TotalEnergies Charge",
        "operateur": "TotalEnergies",
        "pays_origine": ["FR", "BE"],
        "url_officielle": "https://charge.totalenergies.fr",
        "url_tarifs": "https://charge.totalenergies.fr/fr/nos-tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": ["Réseau stations-service TotalEnergies intégré", "Bon roaming EU"],
        "points_faibles": ["Tarifs moins compétitifs sur ultra-rapide"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.40, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.55, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.75, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","NL","ES","IT","AT","LU","CH"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.62},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.82},
            },
        },
    },

    {
        "id": "edf-mobilite",
        "nom": "EDF Mobilité Électrique",
        "operateur": "EDF",
        "pays_origine": ["FR"],
        "url_officielle": "https://www.edf.fr/mobilite-electrique",
        "url_tarifs": "https://www.edf.fr/mobilite-electrique/carte-de-recharge",
        "methode": "httpx",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": ["Intégration avec abonnement EDF domicile", "Tarif AC compétitif"],
        "points_faibles": ["Roaming limité", "Moins de bornes ultra-rapide"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.36, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.51, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.70, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["FR"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
        },
    },

    {
        "id": "recharge-and-drive",
        "nom": "Recharge&Drive",
        "operateur": "Enedis",
        "pays_origine": ["FR"],
        "url_officielle": "https://www.recharge-and-drive.fr",
        "url_tarifs": "https://www.recharge-and-drive.fr/nos-offres",
        "methode": "httpx",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": False,
        "points_forts": ["Réseau bornes Enedis partout en France", "Prix AC compétitif"],
        "points_faibles": ["Pas de roaming EU", "DC rapide limité"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.34, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": None,  "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["FR"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
        },
    },

    {
        "id": "ionity-passport",
        "nom": "IONITY Charge League",
        "operateur": "IONITY",
        "pays_origine": ["FR", "BE", "DE", "AT", "CH", "NL", "NO", "SE", "GB", "ES", "IT", "DK", "LU"],
        "url_officielle": "https://ionity.eu/fr/tarification",
        "url_tarifs": "https://ionity.eu/fr/tarification",
        # PDF officiel "Charge League" du 01/04/2026 — tarifs certifiés réseaux partenaires
        # (Atlante, Electra, Fastned). Scraping httpx maintenu en complément.
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": [
            "Réseau ultra-rapide exclusif ≥350 kW",
            "Présent sur toutes les autoroutes EU",
            "Accès aux réseaux Electra, Fastned, Atlante avec la même carte",
        ],
        "points_faibles": [
            "Uniquement DC ultra-rapide (≥150 kW)",
            "Abonnement annuel obligatoire pour les meilleurs tarifs",
        ],
        "plans": [
            {
                "nom": "IONITY Go",
                "abonnement_eur_an": 0,
                "description": "Sans engagement — paiement à la session",
            },
            {
                "nom": "IONITY Motion",
                "abonnement_eur_an": 365,
                "description": "Abonnement annuel — tarif réduit sur tous les réseaux partenaires",
            },
            {
                "nom": "IONITY Power",
                "abonnement_eur_an": 365,
                "description": "Abonnement annuel premium — meilleur tarif disponible",
            },
        ],
        "donnees_init": {
            # Tarifs plan Motion (365 €/an) — source : PDF Charge League 01/04/2026
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 365, "engagement_mois": 12},
            "tarifs_fr": {
                # DC ultra-rapide ≥150 kW — moyenne Electra/Fastned
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.60,  "frais_session": 0.0},
            },
            # Plan IONITY Go (sans abonnement) — PDF 01/04/2026
            "tarifs_fr_sans_abo": {
                "dc_ultra":   {"modele": "kwh", "prix": 0.66,  "frais_session": 0.0},
            },
            # Plan IONITY Power (365 €/an) — tarif le plus bas disponible
            "tarifs_fr_power": {
                "dc_ultra":   {"modele": "kwh", "prix": 0.55,  "frais_session": 0.0},
            },
            # Belgique — PDF 01/04/2026 (Electra + Fastned)
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.75,  "frais_session": 0.0},
            },
            "tarifs_be_sans_abo": {
                "dc_ultra":   {"modele": "kwh", "prix": 0.85,  "frais_session": 0.0},
            },
            # Suisse — PDF 01/04/2026 (Electra, en CHF)
            "tarifs_ch": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.67,  "frais_session": 0.0},
            },
            "tarifs_ch_sans_abo": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.74,  "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": [
                    "FR","BE","DE","AT","CH","NL","NO","SE","GB",
                    "ES","IT","DK","LU","FI","CZ","HU","PL","SK",
                ],
                # Tarif roaming Motion sur réseaux partenaires EU — FR comme référence
                "tarif_dc_ultra": {"modele": "kwh", "prix": 0.60},
            },
            # Métadonnées source
            "_source": "PDF IONITY Charge League — 01/04/2026",
            "_note": (
                "Tarifs minimum garantis au 01/04/2026. Prix en vigueur sur réseaux partenaires "
                "(Atlante, Electra, Fastned). Les stations IONITY propres peuvent afficher des tarifs "
                "différents selon la localisation (sur/hors autoroute)."
            ),
        },
    },

    {
        "id": "lidl-plus",
        "nom": "Lidl Plus Charge",
        "operateur": "Lidl",
        "pays_origine": ["FR", "BE", "DE", "NL", "AT", "CH", "ES", "IT", "PL"],
        "url_officielle": "https://www.lidl.fr/c/lidl-plus/s10016282",
        "url_tarifs": None,
        "methode": "manuel",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": False,
        "points_forts": ["Tarif AC très compétitif", "Sans abonnement", "App Lidl largement installée"],
        "points_faibles": ["Uniquement bornes Lidl AC 22 kW", "Pas de DC", "Pas de roaming"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.29, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": None,  "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["FR"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
        },
    },

    {
        "id": "plugsurfing",
        "nom": "Plugsurfing",
        "operateur": "Plugsurfing",
        "pays_origine": ["FR", "BE", "DE", "NL", "AT", "CH", "SE", "NO", "FI", "DK"],
        "url_officielle": "https://www.plugsurfing.com/fr",
        "url_tarifs": "https://www.plugsurfing.com/fr/tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": ["Excellent en Scandinavie", "Roaming 30 pays", "Très bon pour voyages longs"],
        "points_faibles": ["Réseau propre limité en France"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.42, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.56, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.74, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","NL","AT","CH","SE","NO","FI","DK","GB","PL","CZ"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.60},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.78},
            },
        },
    },

    {
        "id": "enbw-mobility",
        "nom": "EnBW mobility+",
        "operateur": "EnBW",
        "pays_origine": ["DE", "FR", "AT", "CH", "NL", "BE"],
        "url_officielle": "https://www.enbw.com/elektromobilitaet/produkte/mobility-plus.html",
        "url_tarifs": "https://www.enbw.com/elektromobilitaet/produkte/mobility-plus.html",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": ["Meilleure carte pour voyages Allemagne/Autriche", "Réseau IONITY inclus à tarif réduit"],
        "points_faibles": ["Interface en allemand", "Moins pertinent hors DACH"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.44, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.54, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.69, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["DE","AT","CH","FR","BE","NL","LU","CZ","PL","HU","SK"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.54},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.69},
            },
        },
    },

    # ── BELGIQUE ───────────────────────────────────────────────────────────────

    {
        