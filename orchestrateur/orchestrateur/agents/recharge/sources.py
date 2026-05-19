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
        "pays_origine": ["FR", "BE", "DE", "ES", "IT", "NL", "AT", "CH"],
        "url_officielle": "https://fr.electra.charging",
        "url_tarifs": "https://fr.electra.charging/tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": ["Réseau ultra-rapide ≥150 kW en croissance", "Stations urbaines premium"],
        "points_faibles": ["Réseau encore limité en zones rurales", "Pas d'AC slow"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": None, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.59, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","ES","IT","NL","AT","CH","PT"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.59},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.69},
            },
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
        "nom": "IONITY Passport",
        "operateur": "IONITY",
        "pays_origine": ["FR", "BE", "DE", "AT", "CH", "NL", "NO", "SE", "GB"],
        "url_officielle": "https://ionity.eu/fr/tarification",
        "url_tarifs": "https://ionity.eu/fr/tarification",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": ["Réseau ultra-rapide exclusif ≥350 kW", "Présent sur toutes autoroutes EU"],
        "points_faibles": ["Très cher sans abonnement", "Uniquement DC ultra-rapide"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 17.99, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.35, "frais_session": 0.0},
            },
            "tarifs_fr_sans_abo": {
                "dc_ultra":   {"modele": "kwh", "prix": 0.79, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","AT","CH","NL","NO","SE","GB","DK","FI","CZ","HU","PL","SK"],
                "tarif_dc_ultra": {"modele": "kwh", "prix": 0.35},
            },
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
        "id": "eneco-emobility",
        "nom": "Eneco eMobility",
        "operateur": "Eneco",
        "pays_origine": ["BE", "NL"],
        "url_officielle": "https://emobility.eneco.be/fr",
        "url_tarifs": "https://emobility.eneco.be/fr/tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": ["Leader belge", "Roaming EU large", "Offre flotte complète"],
        "points_faibles": ["Tarif AC moins compétitif que Lidl"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": 0.38, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.52, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.68, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["BE","NL","DE","FR","LU","AT","CH","GB","NO","SE"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.58},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.76},
            },
        },
    },

    {
        "id": "blue-corner",
        "nom": "Blue Corner",
        "operateur": "Blue Corner",
        "pays_origine": ["BE"],
        "url_officielle": "https://www.blue-corner.be/fr",
        "url_tarifs": "https://www.blue-corner.be/fr/tarifs",
        "methode": "httpx",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": ["Réseau belge dense", "Gestion flotte avancée", "Facturation TVA BE simple"],
        "points_faibles": ["Quasi uniquement en Belgique"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": 0.37, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.51, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["BE"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
        },
    },

    {
        "id": "allego",
        "nom": "Allego",
        "operateur": "Allego",
        "pays_origine": ["BE", "NL", "DE", "FR"],
        "url_officielle": "https://www.allego.eu/fr-fr",
        "url_tarifs": "https://www.allego.eu/fr-fr/conducteurs/tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": ["Gros opérateur NL/BE", "Réseau autoroute NL/BE/DE bien maillé"],
        "points_faibles": ["Moins de présence en France"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": 0.40, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.54, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.70, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": ["BE","NL","DE","FR","LU","AT","CH"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.60},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.78},
            },
        },
    },

    {
        "id": "luminus-electric",
        "nom": "Luminus Electric",
        "operateur": "Luminus",
        "pays_origine": ["BE"],
        "url_officielle": "https://www.luminus.be/fr/mobilite-electrique",
        "url_tarifs": "https://www.luminus.be/fr/mobilite-electrique/recharge-publique",
        "methode": "httpx",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": False,
        "points_forts": ["Intégration facture énergie Luminus", "Tarif nocturne avantageux"],
        "points_faibles": ["Réseau limité hors Belgique"],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": 0.36, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.52, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.67, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["BE"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
        },
    },
]

# Index rapide par ID
CARTES_BY_ID: dict[str, dict] = {c["id"]: c for c in CARTES}
