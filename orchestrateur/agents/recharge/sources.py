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

    # -- FRANCE -----------------------------------------------------------------

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
        "points_faibles": [
            "Tarif ultra-rapide élevé sans abonnement",
            "Commission appliquée sur les chargeurs tiers — rarement la moins chère sur un usage régulier (à utiliser plutôt en badge de secours)",
        ],
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
        "points_faibles": [
            "Interface moins intuitive que Chargemap",
            "Tarification mixte kWh + minute selon le CPO : coût final imprévisible si la voiture charge lentement en fin de courbe",
        ],
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
            "Opérateur pur DC ultra-rapide (≥150 kW) — réseau en forte croissance",
            "Stations urbaines premium + autoroute, tarification transparente au kWh",
            "Tarif app compétitif (dès 0,39 €/kWh en France selon station)",
            "Abonnement Electra+ optionnel : jusqu'à -0,20 €/kWh",
        ],
        "points_faibles": [
            "Quasi-absence d'AC lent (réseau DC uniquement, sauf très rares exceptions)",
            "Tarif dynamique en France : varie selon la station (0,39–0,61 €/kWh)",
            "Badge RFID tiers : surcoût possible facturé par le fournisseur du badge",
        ],
        "donnees_init": {
            # Sources croisées :
            #   (1) https://intercom.help/go-electra/fr/articles/7987274 — 02/03/2026
            #   (2) https://www.go-electra.com/en/price/ — mai 2026
            # Electra exploite essentiellement des stations DC ultra-rapides.
            # Les bornes AC sont marginales : le tarif AC n'est pas représentatif.
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

            # -- France ----------------------------------------------------------
            # Tarif dynamique selon occupation station — sources (1) et (2) concordent.
            # AC mis à None : Electra n'opère quasiment pas de bornes AC publiques.
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": None, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.49, "frais_session": 0.0},
                "_dynamique": True,
                "_plage_min": 0.39,
                "_plage_max": 0.61,
                "_tarif_cb_borne": 0.61,
                "_note": "Prix médian retenu (0,49). Autoroute : tarif supérieur affiché sur borne.",
            },

            # -- Belgique ---------------------------------------------------------
            # Tarif dynamique — sources (1) et (2) concordent
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": None, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.65, "frais_session": 0.0},
                "_dynamique": True,
                "_plage_min": 0.54,
                "_plage_max": 0.75,
                "_tarif_cb_borne": 0.75,
            },

            # -- Suisse -----------------------------------------------------------
            # Source (2) corrige source (1) : 0,64 CHF app (pas 0,59), 0,69 CHF CB (pas 0,64)
            "tarifs_ch": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.64, "frais_session": 0.0},
                "_tarif_cb_borne": 0.69,
                "_dynamique": False,
            },

            # -- Autres pays (tarif app sans abonnement) --------------------------
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

            # -- Roaming ----------------------------------------------------------
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","ES","IT","AT","CH","LU"],
                # Pas de tarif roaming fixe : prix local du pays de la station via app
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.49},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.49},
                "_note": "Le tarif appliqué est celui du pays de la station (pas de surcoût roaming).",
            },

            # -- Frais de stationnement (info consommateur) -----------------------
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

    # ⚠ Suppression de la carte "EDF Mobilité Électrique" — branding inexact.
    # EDF ne commercialise pas de carte MSP grand public sous ce nom. Le pendant
    # grand public d'EDF est le Pass IZIVIA (filiale EDF) — voir ci-dessous —
    # donc l'entrée précédente était un doublon trompeur. "IZI by EDF" couvre la
    # borne résidentielle (B2C installation domicile), pas le MSP roaming.

    # ⚠ Suppression de l'ancienne carte "Recharge&Drive (Enedis)" — erreur factuelle.
    # Enedis est le gestionnaire du réseau de distribution d'électricité en France et
    # n'exploite aucune borne de recharge publique (loi de séparation des activités
    # énergie). Remplacée par Izivia, filiale EDF, qui exploite réellement un réseau.
    {
        "id": "izivia-pass",
        "nom": "Izivia Pass",
        "operateur": "Izivia (groupe EDF)",
        "pays_origine": ["FR"],
        "url_officielle": "https://www.izivia.com/conducteurs-vehicules-electriques/le-pass-izivia/",
        "url_tarifs": "https://www.izivia.com/conducteurs-vehicules-electriques/le-pass-izivia/",
        "methode": "httpx",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": True,
        "points_forts": [
            "Filiale EDF — facturation simple et reconnue",
            "Accès au réseau Corri-Door et à de nombreux opérateurs partenaires en France",
            "Offre Pro/Flotte avec facturation centralisée",
        ],
        "points_faibles": [
            "Roaming EU limité (couverture principalement France)",
            "Tarif ultra-rapide moins compétitif que les opérateurs DC purs (Electra, Fastned)",
        ],
        "donnees_init": {
            # Tarifs Pass Izivia à vérifier sur izivia.com — valeurs 2026 indicatives.
            # Le Pass facture au tarif du CPO partenaire + commission Izivia variable.
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.40, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.55, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.69, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["FR"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
            "_note": "Tarifs Pass Izivia indicatifs — variables selon CPO partenaire de la borne.",
        },
    },

    {
        # Carte affichée par défaut = IONITY Motion (abonnement mensuel).
        # IONITY commercialise 4 plans en 2026 :
        #   • Motion     :  5,99 €/mois — tarif kWh réduit
        #   • Power      : 11,99 €/mois — tarif kWh plus fortement réduit (gros rouleurs)
        #   • Motion 365 : 59,99 €/an   → 0,49 €/kWh
        #   • Power 365  : 119,99 €/an  → 0,39 €/kWh
        # Le nom "Passport" n'est plus utilisé depuis le rebranding 2025. L'ancien
        # "IONITY Charge League" (vu en base Supabase) n'est pas un produit conso
        # mais une alliance d'opérateurs (Fastned, Electra, Atlante, IONITY).
        # On garde id="ionity-passport" pour préserver l'historique en base.
        "id": "ionity-passport",
        "nom": "IONITY Motion",
        "operateur": "IONITY",
        "pays_origine": ["FR", "BE", "DE", "AT", "CH", "NL", "NO", "SE", "GB", "ES", "IT", "DK", "LU"],
        "url_officielle": "https://www.ionity.eu/subscriptions",
        "url_tarifs": "https://www.ionity.eu/subscriptions",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": [
            "Réseau ultra-rapide propriétaire ≥350 kW sur toutes les autoroutes EU (~24 pays)",
            "Motion : 5,99 €/mois → tarif kWh réduit. Variante Power à 11,99 €/mois pour gros rouleurs (kWh encore plus réduit).",
            "Plans annuels Motion 365 (59,99 €/an → 0,49 €/kWh) et Power 365 (119,99 €/an → 0,39 €/kWh)",
            "Alternative sans abo (Direct) disponible mais à tarif spot élevé (~0,79 €/kWh)",
        ],
        "points_faibles": [
            "Uniquement DC ultra-rapide (≥150 kW), pas d'AC ni de DC lent",
            "Réseau propre IONITY uniquement (pas de roaming vers d'autres opérateurs)",
            "Tarif vraiment intéressant seulement si vous roulez beaucoup sur autoroute",
        ],
        "donnees_init": {
            # IONITY Motion — abonnement mensuel 5,99 € qui débloque un tarif kWh réduit.
            # Source : ionity.eu/subscriptions — vérifié mai 2026.
            "abonnement": {"mensuel_eur": 5.99, "annuel_eur": 71.88, "engagement_mois": 1},
            "_variante_power": {"mensuel_eur": 11.99, "annuel_eur": 143.88, "engagement_mois": 1},
            "_plan_annuel_motion_365": {"prix_an_eur": 59.99, "kwh_eur": 0.49},
            "_plan_annuel_power_365": {"prix_an_eur": 119.99, "kwh_eur": 0.39},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.49,  "frais_session": 0.0},
                "_tarif_direct_sans_abo": 0.79,
            },
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.55,  "frais_session": 0.0},
                "_tarif_direct_sans_abo": 0.85,
            },
            "tarifs_ch": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.59,  "frais_session": 0.0},
                "_tarif_direct_sans_abo": 0.79,
            },
            "roaming": {
                "disponible": True,
                "pays_couverts": [
                    "FR","BE","DE","AT","CH","NL","NO","SE","GB",
                    "ES","IT","DK","LU","FI","CZ","HU","PL","SK",
                ],
                "tarif_dc_ultra": {"modele": "kwh", "prix": 0.49},
            },
            "_source": "ionity.eu/fr/tarification — à re-vérifier (produits IONITY mis à jour fréquemment).",
            "_note": (
                "Le Passport implique un abonnement mensuel fixe (~5,99 €) qui débloque un tarif "
                "kWh réduit sur tout le réseau IONITY. Sans abonnement, le tarif Direct est "
                "beaucoup plus élevé (~0,79 €/kWh)."
            ),
        },
    },

    {
        # Ce n'est pas une carte MSP roaming : c'est de l'infra plug & charge
        # accessible depuis l'application Lidl Plus. Pas de badge, pas
        # d'abonnement, pas de couverture hors bornes Lidl (~5 400 points FR).
        # Source : lidl.fr/c/e-mobilite — vérifié mai 2026.
        "id": "lidl-plus",
        "nom": "Bornes Lidl (E-Mobilité Lidl Plus)",
        "operateur": "Lidl",
        "pays_origine": ["FR"],
        "url_officielle": "https://www.lidl.fr/c/e-mobilite/s10037236",
        "url_tarifs": "https://www.lidl.fr/c/tarifs-bornes/s10027299",
        "methode": "manuel",
        "ideal_voyage": False,
        "ideal_quotidien": True,
        "flotte_pro": False,
        "points_forts": [
            "Tarif AC parmi les plus bas du marché (0,29 €/kWh) — DC à 0,39 €/kWh",
            "Sans abonnement, sans badge — paiement via app Lidl Plus + Lidl Pay",
            "~5 400 points de charge dans plus de 1 000 supermarchés Lidl en France",
        ],
        "points_faibles": [
            "Strictement limité aux bornes Lidl — pas de roaming, pas de couverture EU",
            "Pas comparable à une carte MSP : c'est de l'infra plug & charge propriétaire",
        ],
        "donnees_init": {
            "abonnement": {"mensuel_eur": 0, "annuel_eur": 0, "engagement_mois": 0},
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": 0.29, "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.39, "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.39, "frais_session": 0.0},
            },
            "roaming": {
                "disponible": False,
                "pays_couverts": ["FR"],
                "tarif_dc_rapide": None,
                "tarif_dc_ultra":  None,
            },
            "_note": "Infra Lidl uniquement, paiement intégré à l'app Lidl Plus.",
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
        "id": "fastned-gold",
        "nom": "Fastned Gold",
        "operateur": "Fastned",
        "pays_origine": ["FR", "BE", "DE", "NL", "CH", "ES", "IT", "DK", "GB"],
        "url_officielle": "https://www.fastnedcharging.com/fr",
        "url_tarifs": "https://www.fastnedcharging.com/fr/recharge/tarifs",
        "methode": "httpx",
        "ideal_voyage": True,
        "ideal_quotidien": False,
        "flotte_pro": False,
        "points_forts": [
            "Tarif simple : Standard (app/CB borne, prix unique) OU Gold Member -25 % via abonnement 11,99 €/mois",
            "300+ stations DC rapide/ultra en Europe sur axes autoroutiers",
            "Abonnement Gold résiliable à tout moment après le premier mois",
            "Couverture 9 pays dont FR, BE, DE, NL, CH, ES, IT",
        ],
        "points_faibles": [
            "Uniquement DC rapide/ultra — pas d'AC lent",
            "Réseau propre Fastned (pas d'accès à d'autres opérateurs)",
            "Abonnement Gold rentable uniquement à partir de ~110 kWh/mois sur Fastned",
        ],
        "donnees_init": {
            # Source : fastnedcharging.com/fr/recharge/tarifs — mai 2026
            # Structure RÉELLE : Standard (app, CB borne, ou badge tiers, tous au même prix)
            # OU abonnement Gold Member 11,99 €/mois qui débloque -25 % sur le tarif kWh.
            # Pas de palier intermédiaire "-10 %" (corrigé d'une erreur précédente).
            # Formule : Gold = Standard × 0,75

            "abonnement": {
                "nom": "Gold Member",
                "mensuel_eur": 11.99,
                "annuel_eur": 0,
                "engagement_mois": 1,
                "reduction_pct": 25,
                "_note": "Résiliable à tout moment après le 1er mois. UK : 9,98 £/mois.",
            },

            # -- France -- Standard 0,61 € | Gold 0,46 € (-25 %)
            "tarifs_fr": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.46,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.46,  "frais_session": 0.0},
                "_standard":  0.61,
                "_gold_abo":  0.46,
            },

            # -- Belgique -- Standard 0,77 € | Gold 0,58 € (-25 %)
            "tarifs_be": {
                "ac_slow":    {"modele": "kwh", "prix": None,  "frais_session": 0.0},
                "dc_rapide":  {"modele": "kwh", "prix": 0.58,  "frais_session": 0.0},
                "dc_ultra":   {"modele": "kwh", "prix": 0.58,  "frais_session": 0.0},
                "_standard":  0.77,
                "_gold_abo":  0.58,
            },

            # -- Suisse -- Standard 0,75 CHF | Gold 0,56 CHF (-25 %)
            "tarifs_ch": {
                "devise": "CHF",
                "dc_ultra":   {"modele": "kwh", "prix": 0.56,  "frais_session": 0.0},
                "_standard":  0.75,
                "_gold_abo":  0.56,
                "_abonnement_mensuel_chf": 11.99,
            },

            # -- Autres pays -- tarifs Gold Member (-25 % sur Standard)
            "tarifs_par_pays": {
                "DE": {"standard": 0.69, "gold": 0.52, "devise": "EUR", "abo_mois": 11.99},
                "NL": {"standard": 0.77, "gold": 0.58, "devise": "EUR", "abo_mois": 11.99},
                "ES": {"standard": 0.59, "gold": 0.44, "devise": "EUR", "abo_mois": 11.99},
                "IT": {"standard": 0.83, "gold": 0.62, "devise": "EUR", "abo_mois": 11.99},
                "DK": {"standard": 3.79, "gold": 2.84, "devise": "DKK", "abo_mois": 89.99},
                "GB": {"standard": 0.79, "gold": 0.59, "devise": "GBP", "abo_mois": 9.98},
            },

            # -- Roaming (badge partenaire sur réseau Fastned)
            "roaming": {
                "disponible": True,
                "pays_couverts": ["FR","BE","DE","NL","CH","ES","IT","DK","GB"],
                "tarif_dc_rapide": {"modele": "kwh", "prix": 0.61},
                "tarif_dc_ultra":  {"modele": "kwh", "prix": 0.61},
                "_note": "Tarif standard appliqué via badge ; le fournisseur badge peut ajouter des frais.",
            },

            "_source": "fastnedcharging.com/fr/recharge/tarifs — mai 2026",
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

    # -- BELGIQUE --

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
        "points_forts": [
            "Acteur belge majeur — forte présence Benelux, ancrage B2B et flottes",
            "Roaming EU large via accords (>20 pays via partenaires européens)",
            "Offre flotte complète avec facturation TVA BE simple",
        ],
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
