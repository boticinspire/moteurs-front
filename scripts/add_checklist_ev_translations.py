"""
Ajoute le namespace ChecklistEV dans messages/{fr,en,nl,de,es,it}.json.

Écriture atomique (tempfile.mkstemp + os.replace), conserve l'ordre des
namespaces existants et préserve l'encodage UTF-8 sans BOM.

Usage : python3 scripts/add_checklist_ev_translations.py
"""

from __future__ import annotations
import json
import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESSAGES = ROOT / "messages"

NAMESPACE = "ChecklistEV"

# ----------------------------------------------------------------------------
# Contenu par locale
# ----------------------------------------------------------------------------

FR = {
    "meta_title": "Pense-bête EV vacances {annee} : 10 conseils pour économiser sur la route",
    "meta_desc": "10 conseils concrets pour réduire le coût d'un trajet vacances en voiture électrique : vitesse, préconditionnement, choix des bornes, aérodynamisme, climatisation et économies à la maison.",
    "og_title": "Pense-bête EV vacances {annee} — Moteurs.com",
    "og_desc": "10 conseils chiffrés pour vos vacances en voiture électrique : jusqu'à 150 € d'économie sur deux semaines.",

    "crumb_hub": "Vacances en voiture",
    "crumb_current": "Pense-bête EV",

    "hero_eyebrow": "Été {annee} · Pense-bête vacances",
    "hero_h1": "10 conseils pour économiser sur votre trajet vacances en voiture électrique",
    "hero_lead": "Un mémo prêt à imprimer, avec des chiffres concrets et les nuances techniques qui font vraiment la différence. À glisser dans la boîte à gants ou à coller sur le frigo avant de partir.",

    "print_btn": "Imprimer le pense-bête",
    "print_btn_aria": "Imprimer cette page",
    "print_hint": "Format optimisé pour A4 — recto seul.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Conso à 110 km/h vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Prix kWh hors HPC autoroute",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Fenêtre optimale de recharge",
    "stat_4_value": "80–150 €",
    "stat_4_label": "Économie sur 2 semaines",

    "intro_para": "Sur un trajet vacances de 1 500 km en voiture électrique, l'écart entre une conduite « brute » et une conduite optimisée peut atteindre 30 à 40 % du coût total — soit l'équivalent d'un plein de carburant thermique. Ces 10 conseils couvrent la maison, le véhicule, la route et la recharge, avec à chaque fois un ordre de grandeur réaliste, ce qu'il faut faire concrètement, le piège classique, et pourquoi ça marche techniquement.",

    "tips_h2": "Les 10 conseils, dans l'ordre d'impact",

    "cat_road": "Sur la route",
    "cat_recharge": "Recharge",
    "cat_vehicle": "Véhicule",
    "cat_house": "À la maison",

    "label_what": "Quoi faire",
    "label_nuance": "Nuance",
    "label_why": "Pourquoi",

    # Tip 1 — vitesse
    "tip_1_title": "Roulez à 110-120 km/h plutôt que 130",
    "tip_1_impact": "Jusqu'à +25 % d'autonomie · ~4-5 min perdues / 100 km",
    "tip_1_what": "Sur autoroute, caler le régulateur à 115 km/h (ou 120 km/h max) au lieu de 130. L'écart de temps total est souvent compensé par une recharge en moins.",
    "tip_1_nuance": "Sur les très longs trajets, le temps total peut même être inférieur grâce à des étapes de recharge plus courtes et plus efficaces.",
    "tip_1_why": "La résistance de l'air croît au carré de la vitesse — passer de 130 à 115 km/h, c'est ~22 % d'effort aéro en moins.",

    # Tip 2 — préconditionnement
    "tip_2_title": "Préconditionnez la batterie avant un HPC",
    "tip_2_impact": "Charge 30-40 % plus rapide en hiver, +10-15 % en intersaison",
    "tip_2_what": "Lancer la navigation vers la borne 20-30 min avant l'arrivée pour que la voiture chauffe la batterie automatiquement (Tesla, Hyundai/Kia E-GMP, BMW, MG, etc.).",
    "tip_2_nuance": "Inutile par 30 °C, crucial après un long ralenti et indispensable en hiver — sinon la borne 350 kW tombera à 50-80 kW.",
    "tip_2_why": "Une cellule lithium-ion accepte sa puissance nominale uniquement entre ~25 et 45 °C ; trop froide, le BMS bride la charge pour ne pas endommager l'anode.",

    # Tip 3 — 10-80
    "tip_3_title": "Visez la fenêtre 10-80 % aux bornes rapides",
    "tip_3_impact": "Temps de pause divisé par ~2 vs charge complète",
    "tip_3_what": "Arriver à 10-15 % de batterie et repartir dès que la borne dépasse 80 %. Sur les trajets très longs, viser même 60-70 % par recharge.",
    "tip_3_nuance": "La courbe de charge s'effondre après 80 %. Un palier 80→100 % peut prendre autant de temps que 10→80 %.",
    "tip_3_why": "La puissance HPC reste constante entre ~10 et 50 % SOC, puis chute progressivement pour préserver les cellules en fin de charge.",

    # Tip 4 — préclim
    "tip_4_title": "Pré-climatisation pendant la recharge",
    "tip_4_impact": "+10-15 % d'autonomie sur les premiers kilomètres",
    "tip_4_what": "Lancer la clim ou le chauffage depuis l'app 5-10 min avant le départ, pendant que la voiture est encore branchée — sur secteur, pas sur la batterie.",
    "tip_4_nuance": "Très efficace sur Tesla, Hyundai, Kia, BMW, MG. Sur les autres marques, vérifier si l'option « preconditionning » est disponible.",
    "tip_4_why": "Refroidir un habitacle de 35 à 22 °C sur batterie consomme 1 à 3 kWh — soit 5 à 15 km d'autonomie envolés au démarrage.",

    # Tip 5 — fuir HPC autoroute
    "tip_5_title": "Fuyez les bornes ultra-rapides d'autoroute",
    "tip_5_impact": "Jusqu'à 40 % d'économie sur le prix au kWh",
    "tip_5_what": "Sortir de l'autoroute 2 à 5 min pour viser un retail park, un centre commercial ou un supermarché : Lidl, Carrefour, Leclerc, Auchan, Aldi.",
    "tip_5_nuance": "En juillet-août, certains lots sont saturés — vérifier disponibilité sur PlugShare ou Chargemap avant de sortir.",
    "tip_5_why": "Ionity, Fastned ou Total HPC autoroute facturent 0,59 à 0,85 €/kWh sans abonnement, contre 0,30 à 0,45 €/kWh sur les bornes grande distribution.",

    # Tip 6 — comparer badges
    "tip_6_title": "Comparez badges, apps et abonnements",
    "tip_6_impact": "Jusqu'à 50 % d'écart sur la même borne",
    "tip_6_what": "Tester Chargeprice, A Better Route Planner (ABRP), Chargemap et PlugShare avant le départ. Choisir l'app/le badge le mieux placé pour vos opérateurs cibles.",
    "tip_6_nuance": "Les abonnements Ionity Motion, Electra Plus ou Fastned Gold deviennent rentables au-delà de ~200 kWh/mois — à l'arbitrage selon votre kilométrage estival.",
    "tip_6_why": "Une même borne Ionity facture 0,69 €/kWh sans abonnement, 0,39 € avec Motion, et autour de 0,35 € via certains badges multi-opérateurs.",

    # Tip 7 — aéro
    "tip_7_title": "Allégez le toit avant de partir",
    "tip_7_impact": "Coffre de toit : +15 à 40 % de conso · barres seules : +2 à 5 %",
    "tip_7_what": "Démonter barres et coffre de toit dès qu'ils ne servent pas. Préférer un porte-vélos d'attelage arrière au porte-vélos de toit.",
    "tip_7_nuance": "L'impact est exponentiel avec la vitesse : négligeable à 80 km/h, énorme à 130. Si vous devez les garder, raison de plus pour ralentir.",
    "tip_7_why": "Les pertes aérodynamiques (surface frontale × Cx) dominent la consommation au-delà de 100 km/h.",

    # Tip 8 — pression pneus
    "tip_8_title": "Pression pneus « pleine charge »",
    "tip_8_impact": "+3 à 7 % d'autonomie",
    "tip_8_what": "Gonfler à la valeur « fortement chargé » du manuel constructeur (souvent +0,2 à +0,3 bar vs usage courant). Vérifier à froid, avant le départ.",
    "tip_8_nuance": "L'astuce du « +0,3 bar à chaud » dépend du modèle et du temps de roulage — idéalement, toujours mesurer à froid en station.",
    "tip_8_why": "La résistance au roulement représente 20 à 25 % de la consommation autoroute ; un sous-gonflage de 0,5 bar suffit à perdre 5 % d'autonomie.",

    # Tip 9 — clim
    "tip_9_title": "Climatisation : écart de 5-7 °C max avec l'extérieur",
    "tip_9_impact": "Jusqu'à −30 % sur la conso de la clim",
    "tip_9_what": "Par 35 °C dehors, viser 27-29 °C dans l'habitacle, pas 20 °C. Utiliser la ventilation et l'ombre du pare-soleil avant de monter en puissance.",
    "tip_9_nuance": "Par forte humidité, basculer en mode « déshumidification » plutôt qu'en grand froid : plus efficace et moins coûteux.",
    "tip_9_why": "Le compresseur de clim consomme proportionnellement à l'écart de température cible — diviser cet écart par 2 divise quasi la conso clim par 2.",

    # Tip 10 — maison
    "tip_10_title": "Avant de partir : chasse aux veilles + chauffe-eau",
    "tip_10_impact": "30 à 90 € économisés sur 15 jours d'absence",
    "tip_10_what": "Couper box internet, décodeurs, TV, chargeurs, machines à café/expresso, et basculer le chauffe-eau électrique sur arrêt ou mode vacances.",
    "tip_10_nuance": "Garder branchés : alarme, domotique critique, frigo/congélateur, caméras. Un congélateur bien plein consomme moins qu'un congélateur vide.",
    "tip_10_why": "Un foyer moyen perd 50 à 100 W de veilles permanentes, et un ballon ECS mal isolé perd 1 à 3 kWh/jour en pertes thermiques.",

    # FAQ
    "faq_h2": "Questions fréquentes",
    "faq_q1": "Sur un trajet de 1 500 km, combien je peux vraiment économiser ?",
    "faq_a1": "Entre 80 et 150 € selon votre voiture et votre départ : 30 à 50 € en évitant les HPC autoroute, 20 à 40 € en ralentissant de 130 à 115 km/h (une recharge en moins), 10 à 30 € en supprimant le coffre de toit, et 30 à 90 € à la maison sur deux semaines de veilles coupées.",
    "faq_q2": "Le préconditionnement marche-t-il sur toutes les voitures électriques ?",
    "faq_a2": "Non. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG, Porsche le proposent en automatique via la navigation. Sur Renault, Peugeot, Citroën, Fiat, c'est en cours de déploiement — vérifiez les paramètres « préconditionnement batterie » dans le menu charge.",
    "faq_q3": "Vaut-il mieux charger à 100 % avant de partir, ou s'arrêter en route ?",
    "faq_a3": "Charger à 100 % à la maison la veille (tarif heures creuses) est presque toujours moins cher qu'une borne publique. En revanche, sur la route, restez dans la fenêtre 10-80 % : c'est là que la borne donne sa pleine puissance, et où le coût total temps + énergie est le plus bas.",
    "faq_q4": "Faut-il vraiment couper la box internet et le chauffe-eau ?",
    "faq_a4": "Oui pour les deux. La box consomme 10 à 20 W en permanence (soit ~3-7 kWh sur 15 jours). Le chauffe-eau électrique 200 L perd 1 à 3 kWh/jour en pertes thermiques quand personne ne l'utilise : 15 à 45 kWh d'économies sur deux semaines, sans aucun inconfort au retour (il remet l'eau à température en 4-6 h).",
    "faq_q5": "Le porte-vélos arrière, c'est vraiment mieux que sur le toit ?",
    "faq_a5": "Oui, presque toujours. Un porte-vélos d'attelage arrière augmente la consommation de 3 à 8 % (selon le nombre de vélos), contre 15 à 30 % pour un porte-vélos de toit ou un coffre. La différence se voit dès le premier plein.",

    "disclaimer": "Les ordres de grandeur indiqués sont des moyennes constatées sur véhicules récents (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). Les économies réelles dépendent du modèle, de la météo, de la charge transportée et du profil de route. Sources : ADEME, Consumer Reports, T&E, retours utilisateurs Moteurs.com.",
    "back_to_hub": "Retour au hub vacances",
    "cta_compare": "Comparer votre trajet",
    "cta_recharge": "Choisir une carte de recharge",
}

EN = {
    "meta_title": "EV holiday cheat sheet {annee}: 10 tips to save on the road",
    "meta_desc": "10 concrete tips to cut the cost of an EV holiday trip: speed, preconditioning, charger choice, aerodynamics, climate control and savings at home.",
    "og_title": "EV holiday cheat sheet {annee} — Moteurs.com",
    "og_desc": "10 evidence-based tips for your electric-car holiday: save up to €150 over two weeks.",

    "crumb_hub": "Holiday driving",
    "crumb_current": "EV cheat sheet",

    "hero_eyebrow": "Summer {annee} · Holiday cheat sheet",
    "hero_h1": "10 tips to save on your EV holiday trip",
    "hero_lead": "A print-ready memo with concrete numbers and the technical nuances that actually matter. Slip it in the glove box or stick it on the fridge before you leave.",

    "print_btn": "Print the cheat sheet",
    "print_btn_aria": "Print this page",
    "print_hint": "Optimised for A4 — single page.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Use at 110 km/h vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Price per kWh off-motorway",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Optimal charging window",
    "stat_4_value": "€80–150",
    "stat_4_label": "Savings over 2 weeks",

    "intro_para": "On a 1,500 km EV holiday trip, the gap between casual and optimised driving can reach 30 to 40 % of the total cost — roughly one tank of petrol. These 10 tips cover home, vehicle, road and charging, each with a realistic order of magnitude, what to do concretely, the common pitfall, and the technical reason it works.",

    "tips_h2": "The 10 tips, ranked by impact",

    "cat_road": "On the road",
    "cat_recharge": "Charging",
    "cat_vehicle": "Vehicle",
    "cat_house": "At home",

    "label_what": "What to do",
    "label_nuance": "Caveat",
    "label_why": "Why it works",

    "tip_1_title": "Drive at 110-120 km/h instead of 130",
    "tip_1_impact": "Up to +25 % range · ~4-5 min lost per 100 km",
    "tip_1_what": "On the motorway, set cruise control to 115 km/h (120 km/h max) instead of 130. The lost time is usually offset by one less charging stop.",
    "tip_1_nuance": "On very long trips, total travel time can even be shorter thanks to faster, more efficient charging stops.",
    "tip_1_why": "Air resistance grows with the square of speed — going from 130 to 115 km/h cuts aero drag by about 22 %.",

    "tip_2_title": "Precondition the battery before a fast charger",
    "tip_2_impact": "Charging 30-40 % faster in winter, +10-15 % in mid-season",
    "tip_2_what": "Set navigation to the charger 20-30 min before arrival so the car warms the battery automatically (Tesla, Hyundai/Kia E-GMP, BMW, MG, etc.).",
    "tip_2_nuance": "Pointless at 30 °C, critical after a long slow drive, essential in winter — otherwise a 350 kW charger will drop to 50-80 kW.",
    "tip_2_why": "Lithium-ion cells deliver full rated power only between ~25 and 45 °C; too cold and the BMS throttles charging to protect the anode.",

    "tip_3_title": "Aim for the 10-80 % window at fast chargers",
    "tip_3_impact": "Charging time roughly halved vs a full charge",
    "tip_3_what": "Arrive at 10-15 % battery and leave as soon as the charger passes 80 %. On very long trips, even aim for 60-70 % per session.",
    "tip_3_nuance": "The charging curve collapses after 80 %. The 80→100 % step can take as long as 10→80 %.",
    "tip_3_why": "Fast-charging power stays constant between ~10 and 50 % SOC, then tapers off to protect the cells at the top end.",

    "tip_4_title": "Pre-condition the cabin while charging",
    "tip_4_impact": "+10-15 % range on the first kilometres",
    "tip_4_what": "Start the AC or heater from the app 5-10 min before leaving, while the car is still plugged in — running off the grid, not the battery.",
    "tip_4_nuance": "Very effective on Tesla, Hyundai, Kia, BMW, MG. On other brands, check whether a 'preconditioning' option is available.",
    "tip_4_why": "Cooling a cabin from 35 to 22 °C off-battery uses 1-3 kWh — that's 5 to 15 km of range gone right at the start.",

    "tip_5_title": "Avoid ultra-fast chargers on the motorway",
    "tip_5_impact": "Up to 40 % cheaper per kWh",
    "tip_5_what": "Leave the motorway for 2-5 min to find a retail park, shopping centre or supermarket: Lidl, Carrefour, Leclerc, Auchan, Aldi.",
    "tip_5_nuance": "In July-August, some sites are saturated — check availability on PlugShare or Chargemap before leaving the motorway.",
    "tip_5_why": "Ionity, Fastned or Total HPC chargers on the motorway charge €0.59-0.85/kWh without a subscription, against €0.30-0.45/kWh at retail charging hubs.",

    "tip_6_title": "Compare cards, apps and subscriptions",
    "tip_6_impact": "Up to 50 % difference on the same charger",
    "tip_6_what": "Test Chargeprice, A Better Route Planner (ABRP), Chargemap and PlugShare before leaving. Pick the app or card best priced for your target operators.",
    "tip_6_nuance": "Ionity Motion, Electra Plus or Fastned Gold subscriptions pay off above ~200 kWh/month — weigh against your expected summer mileage.",
    "tip_6_why": "The same Ionity charger costs €0.69/kWh without a subscription, €0.39 with Motion, and around €0.35 via some multi-operator cards.",

    "tip_7_title": "Strip the roof before leaving",
    "tip_7_impact": "Roof box: +15-40 % use · bars alone: +2-5 %",
    "tip_7_what": "Remove roof bars and roof box whenever they are not strictly needed. Prefer a rear tow-ball bike rack over a roof rack.",
    "tip_7_nuance": "The impact grows exponentially with speed: negligible at 80 km/h, huge at 130. If you must keep them, all the more reason to slow down.",
    "tip_7_why": "Aerodynamic losses (frontal area × Cd) dominate consumption above 100 km/h.",

    "tip_8_title": "Tyres at 'full load' pressure",
    "tip_8_impact": "+3-7 % range",
    "tip_8_what": "Inflate to the manufacturer's 'heavily loaded' value (often +0.2-0.3 bar vs daily use). Check cold, before leaving.",
    "tip_8_nuance": "The '+0.3 bar warm' rule depends on the model and how long you have been driving — ideally always measure cold at the station.",
    "tip_8_why": "Rolling resistance accounts for 20-25 % of motorway consumption; being 0.5 bar low is enough to cost you 5 % of range.",

    "tip_9_title": "AC: keep the gap to outside at 5-7 °C max",
    "tip_9_impact": "Up to −30 % on AC consumption",
    "tip_9_what": "At 35 °C outside, aim for 27-29 °C inside, not 20 °C. Use ventilation and sun-shades first before turning the AC up.",
    "tip_9_nuance": "In high humidity, switch to 'dehumidify' mode rather than aggressive cooling — more effective and cheaper.",
    "tip_9_why": "The AC compressor draws power roughly in proportion to the temperature gap — halving the gap nearly halves AC consumption.",

    "tip_10_title": "Before leaving: hunt standbys + water heater",
    "tip_10_impact": "€30-90 saved over a 15-day trip",
    "tip_10_what": "Unplug the internet router, set-top boxes, TVs, chargers, coffee machines, and switch the electric water heater to off or 'holiday' mode.",
    "tip_10_nuance": "Keep on: alarm, critical home automation, fridge/freezer, cameras. A well-filled freezer uses less than an empty one.",
    "tip_10_why": "An average home loses 50 to 100 W to permanent standby loads, and a poorly insulated hot-water tank loses 1-3 kWh/day in thermal losses.",

    "faq_h2": "Frequently asked questions",
    "faq_q1": "On a 1,500 km trip, how much can I really save?",
    "faq_a1": "Between €80 and €150 depending on car and departure: €30-50 by avoiding motorway fast chargers, €20-40 by cruising at 115 instead of 130 km/h (one fewer charging stop), €10-30 by removing the roof box, and €30-90 at home from killing standby loads over two weeks.",
    "faq_q2": "Does preconditioning work on every EV?",
    "faq_a2": "No. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG and Porsche offer it automatically via the navigation. On Renault, Peugeot, Citroën and Fiat it is rolling out — check the 'battery preconditioning' setting in the charging menu.",
    "faq_q3": "Is it better to fully charge before leaving, or stop along the way?",
    "faq_a3": "Charging to 100 % at home the night before (off-peak rates) is almost always cheaper than a public charger. On the road, however, stay in the 10-80 % window: that is where the charger delivers full power, and where total time + energy cost is lowest.",
    "faq_q4": "Do I really need to unplug the router and switch off the water heater?",
    "faq_a4": "Yes to both. A router draws 10-20 W continuously (around 3-7 kWh over 15 days). A 200-litre electric water heater loses 1-3 kWh/day in thermal losses when nobody uses it: 15-45 kWh saved over two weeks, with no comfort loss on return (it reheats in 4-6 h).",
    "faq_q5": "Is a rear bike rack really better than a roof rack?",
    "faq_a5": "Yes, almost always. A rear tow-ball bike rack adds 3-8 % consumption (depending on the number of bikes), against 15-30 % for a roof rack or roof box. The difference shows on the first tank.",

    "disclaimer": "The orders of magnitude shown are averages observed on recent vehicles (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). Actual savings depend on model, weather, load and road profile. Sources: ADEME, Consumer Reports, T&E, Moteurs.com user feedback.",
    "back_to_hub": "Back to the holiday hub",
    "cta_compare": "Compare your trip",
    "cta_recharge": "Choose a charging card",
}

NL = {
    "meta_title": "EV-vakantie spiekbriefje {annee}: 10 tips om onderweg te besparen",
    "meta_desc": "10 concrete tips om de kosten van een EV-vakantierit te verlagen: snelheid, preconditionering, laderkeuze, aerodynamica, airco en besparingen thuis.",
    "og_title": "EV-vakantie spiekbriefje {annee} — Moteurs.com",
    "og_desc": "10 onderbouwde tips voor uw elektrische vakantierit: tot € 150 besparing in twee weken.",

    "crumb_hub": "Vakantie met de auto",
    "crumb_current": "EV-spiekbriefje",

    "hero_eyebrow": "Zomer {annee} · Vakantie spiekbriefje",
    "hero_h1": "10 tips om te besparen op uw elektrische vakantierit",
    "hero_lead": "Een afdrukbaar memo met concrete cijfers en de technische nuances die er écht toe doen. Steek het in het dashboardkastje of plak het op de koelkast voor vertrek.",

    "print_btn": "Spiekbriefje afdrukken",
    "print_btn_aria": "Deze pagina afdrukken",
    "print_hint": "Geoptimaliseerd voor A4 — één pagina.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Verbruik op 110 km/u vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Prijs/kWh buiten autosnelweg",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Optimale laadvenster",
    "stat_4_value": "€ 80–150",
    "stat_4_label": "Besparing in 2 weken",

    "intro_para": "Op een vakantierit van 1.500 km met een elektrische auto kan het verschil tussen casual en geoptimaliseerd rijden oplopen tot 30 à 40 % van de totale kost — zowat één tank benzine. Deze 10 tips dekken thuis, voertuig, weg en laden af, telkens met een realistische ordegrootte, concreet wat te doen, de klassieke valkuil, en waarom het technisch werkt.",

    "tips_h2": "De 10 tips, gerangschikt op impact",

    "cat_road": "Onderweg",
    "cat_recharge": "Laden",
    "cat_vehicle": "Voertuig",
    "cat_house": "Thuis",

    "label_what": "Wat doen",
    "label_nuance": "Nuance",
    "label_why": "Waarom",

    "tip_1_title": "Rijd 110-120 km/u in plaats van 130",
    "tip_1_impact": "Tot +25 % bereik · ~4-5 min verlies per 100 km",
    "tip_1_what": "Op de snelweg cruise control instellen op 115 km/u (max 120) i.p.v. 130. Het tijdverlies wordt vaak gecompenseerd door één laadstop minder.",
    "tip_1_nuance": "Op zeer lange ritten kan de totale rijtijd zelfs korter zijn dankzij snellere, efficiëntere laadstops.",
    "tip_1_why": "Luchtweerstand stijgt met het kwadraat van de snelheid — van 130 naar 115 km/u betekent ~22 % minder aerodynamische weerstand.",

    "tip_2_title": "Conditioneer de batterij voor een snellader",
    "tip_2_impact": "30-40 % sneller laden in winter, +10-15 % in tussenseizoen",
    "tip_2_what": "Stel de navigatie 20-30 min vóór aankomst in op de lader zodat de auto de batterij automatisch opwarmt (Tesla, Hyundai/Kia E-GMP, BMW, MG, enz.).",
    "tip_2_nuance": "Onnuttig bij 30 °C, cruciaal na lang traag rijden, onmisbaar in de winter — anders zakt een 350 kW-lader naar 50-80 kW.",
    "tip_2_why": "Een lithium-ion cel levert pas vol vermogen tussen ~25 en 45 °C; te koud en het BMS knijpt het laadvermogen af om de anode te beschermen.",

    "tip_3_title": "Mik op het 10-80 %-venster bij snelladers",
    "tip_3_impact": "Laadtijd ongeveer gehalveerd vs volledige lading",
    "tip_3_what": "Aankomen rond 10-15 % batterij en vertrekken zodra de lader voorbij 80 % gaat. Op zeer lange ritten zelfs mikken op 60-70 % per laadbeurt.",
    "tip_3_nuance": "De laadcurve stort in na 80 %. De stap 80→100 % kan even lang duren als 10→80 %.",
    "tip_3_why": "HPC-vermogen blijft constant tussen ~10 en 50 % SOC en taperdt daarna af om de cellen bovenaan te beschermen.",

    "tip_4_title": "Klimaatregeling tijdens het laden voorbereiden",
    "tip_4_impact": "+10-15 % bereik op de eerste kilometers",
    "tip_4_what": "Start de airco of verwarming via de app 5-10 min vóór vertrek, terwijl de auto nog aan de lader hangt — op netstroom, niet op de batterij.",
    "tip_4_nuance": "Heel efficiënt op Tesla, Hyundai, Kia, BMW, MG. Bij andere merken: kijk na of er een 'preconditioning'-optie beschikbaar is.",
    "tip_4_why": "Een cabine afkoelen van 35 naar 22 °C op batterij kost 1-3 kWh — meteen 5 tot 15 km bereik weg bij vertrek.",

    "tip_5_title": "Mijd de ultrasnelladers op de snelweg",
    "tip_5_impact": "Tot 40 % goedkoper per kWh",
    "tip_5_what": "Verlaat de snelweg 2-5 min voor een retailpark, winkelcentrum of supermarkt: Lidl, Carrefour, Leclerc, Auchan, Aldi.",
    "tip_5_nuance": "In juli-augustus zijn sommige locaties verzadigd — check beschikbaarheid via PlugShare of Chargemap vóór de afrit.",
    "tip_5_why": "Ionity, Fastned of Total HPC op de snelweg rekenen € 0,59-0,85/kWh zonder abonnement, tegen € 0,30-0,45/kWh in de retailhubs.",

    "tip_6_title": "Vergelijk passen, apps en abonnementen",
    "tip_6_impact": "Tot 50 % verschil op dezelfde lader",
    "tip_6_what": "Test Chargeprice, A Better Route Planner (ABRP), Chargemap en PlugShare vóór vertrek. Kies de app of pas met de beste tarief voor uw doeloperatoren.",
    "tip_6_nuance": "Ionity Motion, Electra Plus of Fastned Gold-abonnementen lonen vanaf ~200 kWh/maand — afweging op basis van uw zomerkilometers.",
    "tip_6_why": "Dezelfde Ionity-lader rekent € 0,69/kWh zonder abonnement, € 0,39 met Motion en rond € 0,35 via sommige multi-operator passen.",

    "tip_7_title": "Maak het dak leeg vóór vertrek",
    "tip_7_impact": "Dakkoffer: +15-40 % verbruik · enkel barren: +2-5 %",
    "tip_7_what": "Demonteer dakdragers en dakkoffer wanneer ze niet strikt nodig zijn. Verkies een trekhaak-fietsendrager boven een dakdrager.",
    "tip_7_nuance": "De impact stijgt exponentieel met de snelheid: verwaarloosbaar bij 80 km/u, enorm bij 130. Moeten ze blijven, dan nog meer reden om trager te rijden.",
    "tip_7_why": "Aerodynamische verliezen (frontaal oppervlak × Cw) domineren het verbruik boven 100 km/u.",

    "tip_8_title": "Bandenspanning 'volle lading'",
    "tip_8_impact": "+3-7 % bereik",
    "tip_8_what": "Pomp tot de 'zwaar geladen' waarde uit het boordboek (vaak +0,2-0,3 bar t.o.v. dagelijks gebruik). Meet koud, vóór vertrek.",
    "tip_8_nuance": "De '+0,3 bar warm'-vuistregel hangt af van model en rijduur — meet altijd koud aan het tankstation.",
    "tip_8_why": "Rolweerstand is 20-25 % van het snelwegverbruik; 0,5 bar te laag kost al 5 % bereik.",

    "tip_9_title": "Airco: verschil van max 5-7 °C met buiten",
    "tip_9_impact": "Tot −30 % op aircoverbruik",
    "tip_9_what": "Bij 35 °C buiten mik op 27-29 °C binnen, geen 20 °C. Eerst ventilatie en zonnescherm gebruiken voor u de airco opdraait.",
    "tip_9_nuance": "Bij hoge vochtigheid: schakel naar 'ontvochtigen' i.p.v. agressief koelen — efficiënter en goedkoper.",
    "tip_9_why": "De aircocompressor verbruikt ongeveer evenredig met het temperatuurverschil — verschil halveren halveert quasi het verbruik.",

    "tip_10_title": "Voor vertrek: standbystroom + boiler",
    "tip_10_impact": "€ 30-90 besparing per 15 dagen weg",
    "tip_10_what": "Trek internetbox, decoders, tv's, opladers en koffiemachines uit; zet de elektrische boiler op 'uit' of 'vakantie'.",
    "tip_10_nuance": "Aan laten: alarm, kritische domotica, koelkast/diepvries, camera's. Een volle diepvries verbruikt minder dan een lege.",
    "tip_10_why": "Een gemiddeld huishouden verliest 50-100 W aan permanente standby, en een slecht geïsoleerde boiler 1-3 kWh/dag aan thermische verliezen.",

    "faq_h2": "Veelgestelde vragen",
    "faq_q1": "Op een rit van 1.500 km, hoeveel kan ik echt besparen?",
    "faq_a1": "Tussen € 80 en € 150 afhankelijk van auto en vertrekpunt: € 30-50 door snelladers op de snelweg te mijden, € 20-40 door op 115 i.p.v. 130 km/u te rijden (één laadstop minder), € 10-30 door de dakkoffer weg te halen, en € 30-90 thuis door standbyloads te killen over twee weken.",
    "faq_q2": "Werkt preconditionering op elke EV?",
    "faq_a2": "Nee. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG en Porsche bieden het automatisch via de navigatie. Bij Renault, Peugeot, Citroën en Fiat wordt het uitgerold — kijk de optie 'batterij preconditionering' na in het laadmenu.",
    "faq_q3": "Beter volladen voor vertrek of onderweg stoppen?",
    "faq_a3": "Thuis tot 100 % laden de avond ervoor (daltarief) is bijna altijd goedkoper dan een publieke lader. Onderweg blijft het 10-80 %-venster optimaal: daar levert de lader vol vermogen en is de totale kost (tijd + energie) het laagst.",
    "faq_q4": "Moet ik echt de router en boiler uitzetten?",
    "faq_a4": "Ja voor beide. Een router gebruikt 10-20 W continu (zo'n 3-7 kWh in 15 dagen). Een elektrische boiler van 200 L verliest 1-3 kWh/dag aan thermische verliezen als niemand hem gebruikt: 15-45 kWh besparing op twee weken, zonder comfortverlies bij terugkomst (hij is na 4-6 u terug op temperatuur).",
    "faq_q5": "Is een achteraan-fietsendrager echt beter dan op het dak?",
    "faq_a5": "Ja, bijna altijd. Een trekhaak-fietsendrager voegt 3-8 % verbruik toe (afhankelijk van aantal fietsen), tegen 15-30 % voor een dakdrager of dakkoffer. Het verschil zie je al bij de eerste tankbeurt.",

    "disclaimer": "De getoonde ordegroottes zijn gemiddelden gemeten op recente voertuigen (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). Werkelijke besparingen hangen af van model, weer, lading en wegprofiel. Bronnen: ADEME, Consumer Reports, T&E, Moteurs.com gebruikersfeedback.",
    "back_to_hub": "Terug naar de vakantiehub",
    "cta_compare": "Vergelijk uw rit",
    "cta_recharge": "Kies een laadpas",
}

DE = {
    "meta_title": "EV-Urlaubs-Spickzettel {annee}: 10 Tipps zum Sparen auf der Reise",
    "meta_desc": "10 konkrete Tipps, um die Kosten einer Urlaubsfahrt mit dem Elektroauto zu senken: Geschwindigkeit, Vorkonditionierung, Ladewahl, Aerodynamik, Klimaanlage und Einsparungen zu Hause.",
    "og_title": "EV-Urlaubs-Spickzettel {annee} — Moteurs.com",
    "og_desc": "10 fundierte Tipps für Ihre Elektroauto-Reise: bis zu 150 € Ersparnis in zwei Wochen.",

    "crumb_hub": "Urlaub mit dem Auto",
    "crumb_current": "EV-Spickzettel",

    "hero_eyebrow": "Sommer {annee} · Urlaubs-Spickzettel",
    "hero_h1": "10 Tipps zum Sparen auf Ihrer Elektroauto-Reise",
    "hero_lead": "Ein druckfertiges Memo mit konkreten Zahlen und den technischen Nuancen, auf die es wirklich ankommt. Vor der Abfahrt ins Handschuhfach stecken oder an den Kühlschrank kleben.",

    "print_btn": "Spickzettel drucken",
    "print_btn_aria": "Diese Seite drucken",
    "print_hint": "Für A4 optimiert — eine Seite.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Verbrauch 110 km/h vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Preis/kWh außerhalb der Autobahn",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Optimales Ladefenster",
    "stat_4_value": "80–150 €",
    "stat_4_label": "Ersparnis über 2 Wochen",

    "intro_para": "Auf einer 1.500-km-Urlaubsfahrt mit dem Elektroauto kann der Unterschied zwischen entspanntem und optimiertem Fahren 30 bis 40 % der Gesamtkosten ausmachen — etwa eine Tankfüllung Benzin. Diese 10 Tipps decken Haus, Fahrzeug, Straße und Laden ab, jeweils mit realistischer Größenordnung, was konkret zu tun ist, der typischen Falle und der technischen Begründung.",

    "tips_h2": "Die 10 Tipps, nach Wirkung geordnet",

    "cat_road": "Auf der Straße",
    "cat_recharge": "Laden",
    "cat_vehicle": "Fahrzeug",
    "cat_house": "Zu Hause",

    "label_what": "Was tun",
    "label_nuance": "Einschränkung",
    "label_why": "Warum",

    "tip_1_title": "Fahren Sie 110-120 km/h statt 130",
    "tip_1_impact": "Bis zu +25 % Reichweite · ~4-5 min Verlust pro 100 km",
    "tip_1_what": "Auf der Autobahn Tempomat auf 115 km/h (max 120) statt 130 stellen. Der Zeitverlust wird oft durch einen Ladestopp weniger ausgeglichen.",
    "tip_1_nuance": "Auf sehr langen Strecken kann die Gesamtfahrzeit dank schnellerer, effizienterer Ladestopps sogar kürzer sein.",
    "tip_1_why": "Luftwiderstand wächst im Quadrat der Geschwindigkeit — von 130 auf 115 km/h sind ca. 22 % weniger aerodynamischer Widerstand.",

    "tip_2_title": "Batterie vor dem Schnelllader vorkonditionieren",
    "tip_2_impact": "30-40 % schnelleres Laden im Winter, +10-15 % in Übergangszeit",
    "tip_2_what": "Navigation 20-30 min vor Ankunft auf den Lader stellen, damit das Auto die Batterie automatisch vorwärmt (Tesla, Hyundai/Kia E-GMP, BMW, MG, etc.).",
    "tip_2_nuance": "Bei 30 °C nutzlos, nach langer langsamer Fahrt entscheidend, im Winter unverzichtbar — sonst sinkt ein 350-kW-Lader auf 50-80 kW.",
    "tip_2_why": "Eine Lithium-Ionen-Zelle gibt Nennleistung nur zwischen ~25 und 45 °C ab; zu kalt drosselt das BMS, um die Anode zu schützen.",

    "tip_3_title": "Am Schnelllader das 10-80 %-Fenster anpeilen",
    "tip_3_impact": "Ladezeit etwa halbiert vs vollständige Ladung",
    "tip_3_what": "Mit 10-15 % Batterie ankommen und wieder los, sobald der Lader die 80 % überschreitet. Auf sehr langen Touren sogar 60-70 % pro Ladung anpeilen.",
    "tip_3_nuance": "Die Ladekurve bricht nach 80 % ein. Der Schritt 80→100 % kann so lange dauern wie 10→80 %.",
    "tip_3_why": "Die HPC-Leistung bleibt zwischen ~10 und 50 % SOC konstant und sinkt dann, um die Zellen oben zu schonen.",

    "tip_4_title": "Klimatisierung während des Ladens vorbereiten",
    "tip_4_impact": "+10-15 % Reichweite auf den ersten Kilometern",
    "tip_4_what": "Klimaanlage oder Heizung 5-10 min vor Abfahrt über die App starten, während das Auto noch am Lader hängt — über das Netz, nicht über die Batterie.",
    "tip_4_nuance": "Sehr effektiv bei Tesla, Hyundai, Kia, BMW, MG. Bei anderen Marken prüfen, ob eine 'Preconditioning'-Option verfügbar ist.",
    "tip_4_why": "Eine Kabine von 35 auf 22 °C aus der Batterie zu kühlen verbraucht 1-3 kWh — gleich 5 bis 15 km Reichweite weg beim Start.",

    "tip_5_title": "Meiden Sie Ultra-Schnelllader auf der Autobahn",
    "tip_5_impact": "Bis zu 40 % günstiger pro kWh",
    "tip_5_what": "2-5 min von der Autobahn abfahren zu Einkaufszentren, Retail-Parks oder Supermärkten: Lidl, Kaufland, Aldi, Carrefour, Leclerc.",
    "tip_5_nuance": "Im Juli-August sind manche Standorte überlastet — Verfügbarkeit über PlugShare oder Chargemap vor der Abfahrt prüfen.",
    "tip_5_why": "Ionity, Fastned oder Total HPC an der Autobahn verlangen 0,59-0,85 €/kWh ohne Abo, gegenüber 0,30-0,45 €/kWh bei den Einzelhandels-Ladehubs.",

    "tip_6_title": "Karten, Apps und Abos vergleichen",
    "tip_6_impact": "Bis zu 50 % Unterschied an derselben Säule",
    "tip_6_what": "Vor Abfahrt Chargeprice, A Better Route Planner (ABRP), Chargemap und PlugShare testen. Die App oder Karte mit dem besten Tarif für Ihre Zielbetreiber wählen.",
    "tip_6_nuance": "Abos wie Ionity Motion, Electra Plus oder Fastned Gold lohnen sich ab ca. 200 kWh/Monat — gegen Ihre Sommerkilometer abwägen.",
    "tip_6_why": "Dieselbe Ionity-Säule kostet 0,69 €/kWh ohne Abo, 0,39 € mit Motion und um die 0,35 € über manche Multi-Operator-Karten.",

    "tip_7_title": "Vor der Abfahrt das Dach leeren",
    "tip_7_impact": "Dachbox: +15-40 % Verbrauch · nur Träger: +2-5 %",
    "tip_7_what": "Dachträger und Dachbox demontieren, wenn nicht streng nötig. Heck-Fahrradträger an der Anhängerkupplung dem Dachträger vorziehen.",
    "tip_7_nuance": "Die Wirkung steigt exponentiell mit der Geschwindigkeit: vernachlässigbar bei 80 km/h, riesig bei 130. Wenn sie bleiben müssen — umso mehr Grund, langsamer zu fahren.",
    "tip_7_why": "Aerodynamische Verluste (Stirnfläche × cw) dominieren den Verbrauch ab 100 km/h.",

    "tip_8_title": "Reifendruck auf 'Volllast' anheben",
    "tip_8_impact": "+3-7 % Reichweite",
    "tip_8_what": "Auf den Wert für 'schwer beladen' aus dem Handbuch aufpumpen (oft +0,2-0,3 bar gegenüber Alltag). Vor der Abfahrt kalt messen.",
    "tip_8_nuance": "Die Faustregel '+0,3 bar warm' hängt vom Modell und der Fahrdauer ab — idealerweise immer kalt an der Tankstelle messen.",
    "tip_8_why": "Der Rollwiderstand macht 20-25 % des Autobahnverbrauchs aus; nur 0,5 bar zu wenig kosten bereits 5 % Reichweite.",

    "tip_9_title": "Klimaanlage: max 5-7 °C Unterschied zur Außentemperatur",
    "tip_9_impact": "Bis zu −30 % beim Klima-Verbrauch",
    "tip_9_what": "Bei 35 °C außen 27-29 °C innen anpeilen, nicht 20 °C. Erst Lüftung und Sonnenschutz nutzen, bevor die Klimaanlage hochgefahren wird.",
    "tip_9_nuance": "Bei hoher Luftfeuchtigkeit lieber 'Entfeuchten' wählen als aggressive Kühlung — effektiver und günstiger.",
    "tip_9_why": "Der Klimakompressor verbraucht etwa proportional zum Temperaturunterschied — Differenz halbieren heißt Verbrauch fast halbieren.",

    "tip_10_title": "Vor der Abfahrt: Standby + Warmwasserbereiter",
    "tip_10_impact": "30-90 € Ersparnis bei 15 Tagen Abwesenheit",
    "tip_10_what": "Internet-Router, Receiver, Fernseher, Ladegeräte, Kaffeemaschinen vom Netz nehmen und elektrischen Warmwasserbereiter auf 'Aus' oder 'Urlaub' stellen.",
    "tip_10_nuance": "Eingeschaltet lassen: Alarm, kritische Smart-Home-Geräte, Kühl- und Gefrierschrank, Kameras. Ein voller Gefrierschrank verbraucht weniger als ein leerer.",
    "tip_10_why": "Ein durchschnittlicher Haushalt verliert 50-100 W an permanentem Standby, und ein schlecht isolierter Boiler 1-3 kWh/Tag an Wärmeverlusten.",

    "faq_h2": "Häufig gestellte Fragen",
    "faq_q1": "Wie viel kann ich auf einer 1.500-km-Reise wirklich sparen?",
    "faq_a1": "Zwischen 80 und 150 € je nach Auto und Abfahrt: 30-50 € durch Meiden der Autobahn-Schnelllader, 20-40 € durch Tempo 115 statt 130 (ein Ladestopp weniger), 10-30 € durch Demontage der Dachbox und 30-90 € zu Hause durch Abschalten der Standby-Lasten über zwei Wochen.",
    "faq_q2": "Funktioniert Vorkonditionierung bei jedem Elektroauto?",
    "faq_a2": "Nein. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG und Porsche bieten sie automatisch über die Navigation. Bei Renault, Peugeot, Citroën und Fiat ist sie im Rollout — Option 'Batterie-Vorkonditionierung' im Lademenü prüfen.",
    "faq_q3": "Lieber vor der Abfahrt voll laden oder unterwegs stoppen?",
    "faq_a3": "Zu Hause am Vorabend auf 100 % laden (Nachtstrom) ist fast immer günstiger als ein öffentlicher Lader. Unterwegs bleibt das 10-80 %-Fenster optimal: dort liefert der Lader volle Leistung und die Gesamtkosten (Zeit + Energie) sind am niedrigsten.",
    "faq_q4": "Muss ich wirklich Router und Warmwasserbereiter ausschalten?",
    "faq_a4": "Ja, beides. Ein Router zieht 10-20 W dauerhaft (rund 3-7 kWh in 15 Tagen). Ein 200-Liter-Elektroboiler verliert 1-3 kWh/Tag durch Wärmeverluste, wenn ihn niemand nutzt: 15-45 kWh Ersparnis in zwei Wochen, ohne Komfortverlust bei Rückkehr (er ist in 4-6 h wieder warm).",
    "faq_q5": "Ist ein Heck-Fahrradträger wirklich besser als auf dem Dach?",
    "faq_a5": "Ja, fast immer. Ein Heck-Fahrradträger an der Anhängerkupplung erhöht den Verbrauch um 3-8 % (je nach Anzahl Räder), gegenüber 15-30 % bei einem Dachträger oder einer Dachbox. Der Unterschied zeigt sich schon bei der ersten Tankfüllung.",

    "disclaimer": "Die angegebenen Größenordnungen sind Durchschnittswerte aktueller Fahrzeuge (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). Die tatsächlichen Einsparungen hängen vom Modell, Wetter, Beladung und Streckenprofil ab. Quellen: ADEME, Consumer Reports, T&E, Moteurs.com-Nutzerfeedback.",
    "back_to_hub": "Zurück zum Urlaubs-Hub",
    "cta_compare": "Vergleichen Sie Ihre Strecke",
    "cta_recharge": "Eine Ladekarte wählen",
}

ES = {
    "meta_title": "Chuleta EV vacaciones {annee}: 10 consejos para ahorrar en ruta",
    "meta_desc": "10 consejos concretos para reducir el coste de un viaje de vacaciones en coche eléctrico: velocidad, preacondicionamiento, elección de cargadores, aerodinámica, climatización y ahorro en casa.",
    "og_title": "Chuleta EV vacaciones {annee} — Moteurs.com",
    "og_desc": "10 consejos con cifras para sus vacaciones en coche eléctrico: hasta 150 € de ahorro en dos semanas.",

    "crumb_hub": "Vacaciones en coche",
    "crumb_current": "Chuleta EV",

    "hero_eyebrow": "Verano {annee} · Chuleta de vacaciones",
    "hero_h1": "10 consejos para ahorrar en su viaje de vacaciones en coche eléctrico",
    "hero_lead": "Un memo listo para imprimir, con cifras concretas y los matices técnicos que realmente marcan la diferencia. Para meter en la guantera o pegar en la nevera antes de salir.",

    "print_btn": "Imprimir la chuleta",
    "print_btn_aria": "Imprimir esta página",
    "print_hint": "Optimizado para A4 — una sola cara.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Consumo a 110 km/h vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Precio kWh fuera de autopista",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Ventana óptima de carga",
    "stat_4_value": "80–150 €",
    "stat_4_label": "Ahorro en 2 semanas",

    "intro_para": "En un trayecto vacacional de 1.500 km con coche eléctrico, la diferencia entre conducir relajado y conducir optimizado puede llegar al 30-40 % del coste total — el equivalente a un depósito de gasolina. Estos 10 consejos cubren casa, vehículo, ruta y carga, cada uno con su orden de magnitud realista, qué hacer concretamente, la trampa habitual y la razón técnica.",

    "tips_h2": "Los 10 consejos, por orden de impacto",

    "cat_road": "En la carretera",
    "cat_recharge": "Carga",
    "cat_vehicle": "Vehículo",
    "cat_house": "En casa",

    "label_what": "Qué hacer",
    "label_nuance": "Matiz",
    "label_why": "Por qué",

    "tip_1_title": "Circule a 110-120 km/h en vez de 130",
    "tip_1_impact": "Hasta +25 % de autonomía · ~4-5 min perdidos cada 100 km",
    "tip_1_what": "En autopista, fije el control de crucero a 115 km/h (máx. 120) en lugar de 130. El tiempo perdido suele compensarse con una parada de carga menos.",
    "tip_1_nuance": "En viajes muy largos, el tiempo total puede incluso reducirse gracias a paradas de carga más rápidas y eficientes.",
    "tip_1_why": "La resistencia del aire crece con el cuadrado de la velocidad — pasar de 130 a 115 km/h supone ~22 % menos de resistencia aerodinámica.",

    "tip_2_title": "Preacondicione la batería antes de un cargador rápido",
    "tip_2_impact": "Carga 30-40 % más rápida en invierno, +10-15 % en entretiempo",
    "tip_2_what": "Indique el cargador en la navegación 20-30 min antes de llegar para que el coche caliente la batería automáticamente (Tesla, Hyundai/Kia E-GMP, BMW, MG, etc.).",
    "tip_2_nuance": "Inútil a 30 °C, crítico tras un trayecto lento largo, indispensable en invierno — si no, un cargador de 350 kW caerá a 50-80 kW.",
    "tip_2_why": "Una célula de iones de litio entrega su potencia nominal solo entre ~25 y 45 °C; demasiado fría, el BMS limita la carga para proteger el ánodo.",

    "tip_3_title": "Apunte a la ventana 10-80 % en cargadores rápidos",
    "tip_3_impact": "Tiempo de parada aproximadamente la mitad vs carga completa",
    "tip_3_what": "Llegue al 10-15 % de batería y márchese en cuanto el cargador pase el 80 %. En trayectos muy largos, incluso apunte al 60-70 % por sesión.",
    "tip_3_nuance": "La curva de carga se desploma tras el 80 %. El tramo 80→100 % puede durar tanto como el 10→80 %.",
    "tip_3_why": "La potencia HPC se mantiene constante entre ~10 y 50 % SOC, luego baja para proteger las células en el tramo alto.",

    "tip_4_title": "Preclimatice durante la carga",
    "tip_4_impact": "+10-15 % de autonomía en los primeros kilómetros",
    "tip_4_what": "Active el AC o la calefacción desde la app 5-10 min antes de salir, con el coche aún enchufado — desde la red, no de la batería.",
    "tip_4_nuance": "Muy eficaz en Tesla, Hyundai, Kia, BMW, MG. En otras marcas, compruebe si existe la opción 'preconditioning'.",
    "tip_4_why": "Enfriar el habitáculo de 35 a 22 °C con batería consume 1-3 kWh — 5 a 15 km de autonomía perdidos nada más arrancar.",

    "tip_5_title": "Huya de los cargadores ultra-rápidos de autopista",
    "tip_5_impact": "Hasta 40 % más barato por kWh",
    "tip_5_what": "Salga de la autopista 2-5 min para ir a un retail park, centro comercial o supermercado: Lidl, Carrefour, Mercadona, Alcampo, Aldi.",
    "tip_5_nuance": "En julio-agosto algunos puntos están saturados — compruebe disponibilidad en PlugShare o Chargemap antes de salir.",
    "tip_5_why": "Ionity, Fastned o Total HPC en autopista facturan 0,59-0,85 €/kWh sin abono, frente a 0,30-0,45 €/kWh en los hubs de distribución.",

    "tip_6_title": "Compare tarjetas, apps y suscripciones",
    "tip_6_impact": "Hasta 50 % de diferencia en el mismo cargador",
    "tip_6_what": "Pruebe Chargeprice, A Better Route Planner (ABRP), Chargemap y PlugShare antes de salir. Elija la app o tarjeta con mejor precio para sus operadores objetivo.",
    "tip_6_nuance": "Las suscripciones Ionity Motion, Electra Plus o Fastned Gold compensan a partir de ~200 kWh/mes — sopese con sus kilómetros de verano.",
    "tip_6_why": "El mismo cargador Ionity cobra 0,69 €/kWh sin abono, 0,39 € con Motion y alrededor de 0,35 € vía algunas tarjetas multi-operador.",

    "tip_7_title": "Aligere el techo antes de salir",
    "tip_7_impact": "Cofre de techo: +15-40 % de consumo · barras solas: +2-5 %",
    "tip_7_what": "Desmonte barras y cofre de techo cuando no sean estrictamente necesarios. Prefiera un portabicicletas trasero de bola al de techo.",
    "tip_7_nuance": "El impacto crece exponencialmente con la velocidad: insignificante a 80 km/h, enorme a 130. Si debe mantenerlos, mayor razón para ralentizar.",
    "tip_7_why": "Las pérdidas aerodinámicas (superficie frontal × Cx) dominan el consumo por encima de 100 km/h.",

    "tip_8_title": "Presión de neumáticos 'plena carga'",
    "tip_8_impact": "+3-7 % de autonomía",
    "tip_8_what": "Infle al valor 'fuertemente cargado' del manual (a menudo +0,2-0,3 bar respecto al uso diario). Mida en frío, antes de salir.",
    "tip_8_nuance": "El truco del '+0,3 bar en caliente' depende del modelo y del tiempo de rodaje — idealmente, mida siempre en frío en estación.",
    "tip_8_why": "La resistencia a la rodadura supone 20-25 % del consumo en autopista; tener 0,5 bar de menos ya cuesta 5 % de autonomía.",

    "tip_9_title": "Aire acondicionado: máximo 5-7 °C de diferencia con el exterior",
    "tip_9_impact": "Hasta −30 % en el consumo del AC",
    "tip_9_what": "Con 35 °C fuera, apunte a 27-29 °C dentro, no a 20 °C. Use primero ventilación y parasoles antes de subir el AC.",
    "tip_9_nuance": "Con humedad alta, cambie a modo 'deshumidificar' en lugar de frío agresivo — más eficaz y económico.",
    "tip_9_why": "El compresor del AC consume proporcionalmente al gradiente de temperatura — dividir el gradiente por 2 casi divide el consumo del AC por 2.",

    "tip_10_title": "Antes de partir: caza al standby + termo",
    "tip_10_impact": "30-90 € ahorrados en 15 días fuera",
    "tip_10_what": "Desenchufe router, decodificadores, TV, cargadores, cafeteras, y ponga el termo eléctrico en apagado o modo vacaciones.",
    "tip_10_nuance": "Mantenga: alarma, domótica crítica, frigorífico/congelador, cámaras. Un congelador bien lleno consume menos que uno vacío.",
    "tip_10_why": "Un hogar medio pierde 50-100 W en standby permanente y un termo mal aislado pierde 1-3 kWh/día por pérdidas térmicas.",

    "faq_h2": "Preguntas frecuentes",
    "faq_q1": "En un viaje de 1.500 km, ¿cuánto puedo ahorrar realmente?",
    "faq_a1": "Entre 80 y 150 € según coche y salida: 30-50 € evitando los cargadores rápidos de autopista, 20-40 € yendo a 115 en vez de 130 km/h (una parada menos), 10-30 € quitando el cofre de techo y 30-90 € en casa cortando standby durante dos semanas.",
    "faq_q2": "¿El preacondicionamiento funciona en todos los coches eléctricos?",
    "faq_a2": "No. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG y Porsche lo ofrecen automáticamente vía navegación. En Renault, Peugeot, Citroën y Fiat se está desplegando — verifique 'preacondicionamiento batería' en el menú de carga.",
    "faq_q3": "¿Mejor cargar al 100 % antes de salir o parar por el camino?",
    "faq_a3": "Cargar al 100 % en casa la noche anterior (tarifa valle) es casi siempre más barato que un cargador público. En ruta, mantenga la ventana 10-80 %: ahí el cargador entrega plena potencia y el coste total tiempo + energía es mínimo.",
    "faq_q4": "¿Realmente hay que desenchufar el router y el termo?",
    "faq_a4": "Sí, ambos. Un router consume 10-20 W permanentes (~3-7 kWh en 15 días). Un termo eléctrico de 200 L pierde 1-3 kWh/día por pérdidas térmicas sin uso: 15-45 kWh ahorrados en dos semanas, sin incomodidad al regreso (recupera temperatura en 4-6 h).",
    "faq_q5": "¿Un portabicicletas trasero es realmente mejor que uno de techo?",
    "faq_a5": "Sí, casi siempre. Un portabicicletas trasero de bola añade 3-8 % de consumo (según número de bicis), frente a 15-30 % en techo o cofre. La diferencia se ve ya en el primer repostaje.",

    "disclaimer": "Los órdenes de magnitud indicados son promedios observados en vehículos recientes (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). El ahorro real depende del modelo, meteorología, carga y perfil de ruta. Fuentes: ADEME, Consumer Reports, T&E, retroalimentación usuarios Moteurs.com.",
    "back_to_hub": "Volver al hub de vacaciones",
    "cta_compare": "Comparar su trayecto",
    "cta_recharge": "Elegir una tarjeta de recarga",
}

IT = {
    "meta_title": "Memo EV vacanze {annee}: 10 consigli per risparmiare in viaggio",
    "meta_desc": "10 consigli concreti per ridurre il costo di un viaggio in auto elettrica: velocità, precondizionamento, scelta delle colonnine, aerodinamica, climatizzazione e risparmi a casa.",
    "og_title": "Memo EV vacanze {annee} — Moteurs.com",
    "og_desc": "10 consigli con cifre per le vostre vacanze in auto elettrica: fino a 150 € di risparmio in due settimane.",

    "crumb_hub": "Vacanze in auto",
    "crumb_current": "Memo EV",

    "hero_eyebrow": "Estate {annee} · Memo vacanze",
    "hero_h1": "10 consigli per risparmiare sul vostro viaggio in auto elettrica",
    "hero_lead": "Un memo pronto da stampare con cifre concrete e le sfumature tecniche che fanno davvero la differenza. Da mettere nel cruscotto o attaccare al frigo prima di partire.",

    "print_btn": "Stampa il memo",
    "print_btn_aria": "Stampa questa pagina",
    "print_hint": "Ottimizzato per A4 — una pagina.",

    "stat_1_value": "−25 %",
    "stat_1_label": "Consumo a 110 km/h vs 130",
    "stat_2_value": "−50 %",
    "stat_2_label": "Prezzo kWh fuori autostrada",
    "stat_3_value": "10–80 %",
    "stat_3_label": "Finestra ottimale di ricarica",
    "stat_4_value": "80–150 €",
    "stat_4_label": "Risparmio in 2 settimane",

    "intro_para": "Su un viaggio vacanze di 1.500 km in auto elettrica, lo scarto tra guida rilassata e guida ottimizzata può raggiungere il 30-40 % del costo totale — l'equivalente di un pieno di benzina. Questi 10 consigli coprono casa, veicolo, strada e ricarica, ciascuno con un ordine di grandezza realistico, cosa fare concretamente, la trappola tipica e la ragione tecnica.",

    "tips_h2": "I 10 consigli, in ordine di impatto",

    "cat_road": "In viaggio",
    "cat_recharge": "Ricarica",
    "cat_vehicle": "Veicolo",
    "cat_house": "A casa",

    "label_what": "Cosa fare",
    "label_nuance": "Nota",
    "label_why": "Perché",

    "tip_1_title": "Guidate a 110-120 km/h invece di 130",
    "tip_1_impact": "Fino a +25 % di autonomia · ~4-5 min persi ogni 100 km",
    "tip_1_what": "In autostrada impostate il cruise a 115 km/h (max 120) anziché 130. Il tempo perso è spesso compensato da una sosta di ricarica in meno.",
    "tip_1_nuance": "Su viaggi molto lunghi, il tempo totale può addirittura ridursi grazie a soste di ricarica più rapide ed efficienti.",
    "tip_1_why": "La resistenza dell'aria cresce con il quadrato della velocità — passare da 130 a 115 km/h significa circa 22 % in meno di resistenza aerodinamica.",

    "tip_2_title": "Precondizionate la batteria prima di una colonnina rapida",
    "tip_2_impact": "Ricarica 30-40 % più veloce d'inverno, +10-15 % in mezza stagione",
    "tip_2_what": "Impostate il navigatore sulla colonnina 20-30 min prima dell'arrivo, così l'auto riscalda automaticamente la batteria (Tesla, Hyundai/Kia E-GMP, BMW, MG, ecc.).",
    "tip_2_nuance": "Inutile a 30 °C, fondamentale dopo lunghi tratti lenti, indispensabile d'inverno — altrimenti una colonnina da 350 kW scenderà a 50-80 kW.",
    "tip_2_why": "Una cella al litio eroga la potenza nominale solo tra ~25 e 45 °C; troppo fredda, il BMS limita la ricarica per proteggere l'anodo.",

    "tip_3_title": "Mirate alla finestra 10-80 % sulle colonnine rapide",
    "tip_3_impact": "Tempo di sosta circa dimezzato vs ricarica completa",
    "tip_3_what": "Arrivate al 10-15 % di batteria e ripartite appena la colonnina supera l'80 %. Su tratte molto lunghe, mirate anche al 60-70 % per sessione.",
    "tip_3_nuance": "La curva di ricarica crolla dopo l'80 %. Lo step 80→100 % può durare quanto il 10→80 %.",
    "tip_3_why": "La potenza HPC resta costante tra ~10 e 50 % SOC, poi cala per proteggere le celle in cima.",

    "tip_4_title": "Preclimatizzate durante la ricarica",
    "tip_4_impact": "+10-15 % di autonomia sui primi chilometri",
    "tip_4_what": "Avviate AC o riscaldamento dall'app 5-10 min prima di partire, con l'auto ancora collegata — sulla rete, non sulla batteria.",
    "tip_4_nuance": "Molto efficace su Tesla, Hyundai, Kia, BMW, MG. Su altre marche verificate la presenza dell'opzione 'preconditioning'.",
    "tip_4_why": "Raffreddare l'abitacolo da 35 a 22 °C dalla batteria consuma 1-3 kWh — 5-15 km di autonomia persi alla partenza.",

    "tip_5_title": "Evitate le colonnine ultra-rapide in autostrada",
    "tip_5_impact": "Fino al 40 % più economico al kWh",
    "tip_5_what": "Uscite dall'autostrada per 2-5 min verso retail park, centri commerciali o supermercati: Lidl, Esselunga, Carrefour, Aldi, Auchan.",
    "tip_5_nuance": "A luglio-agosto alcuni siti sono saturi — controllate disponibilità su PlugShare o Chargemap prima dell'uscita.",
    "tip_5_why": "Ionity, Fastned o Total HPC in autostrada applicano 0,59-0,85 €/kWh senza abbonamento, contro 0,30-0,45 €/kWh nei hub di distribuzione.",

    "tip_6_title": "Confrontate tessere, app e abbonamenti",
    "tip_6_impact": "Fino al 50 % di scarto sulla stessa colonnina",
    "tip_6_what": "Testate Chargeprice, A Better Route Planner (ABRP), Chargemap e PlugShare prima della partenza. Scegliete app o tessera con il prezzo migliore per i vostri operatori target.",
    "tip_6_nuance": "Abbonamenti Ionity Motion, Electra Plus o Fastned Gold convengono oltre ~200 kWh/mese — valutate rispetto ai chilometri estivi previsti.",
    "tip_6_why": "La stessa colonnina Ionity costa 0,69 €/kWh senza abbonamento, 0,39 € con Motion e intorno a 0,35 € tramite alcune tessere multi-operatore.",

    "tip_7_title": "Alleggerite il tetto prima di partire",
    "tip_7_impact": "Box tetto: +15-40 % consumo · solo barre: +2-5 %",
    "tip_7_what": "Smontate barre e box da tetto quando non strettamente necessari. Preferite un portabici al gancio rispetto a quello da tetto.",
    "tip_7_nuance": "L'impatto cresce esponenzialmente con la velocità: trascurabile a 80 km/h, enorme a 130. Se dovete tenerli, motivo in più per rallentare.",
    "tip_7_why": "Le perdite aerodinamiche (superficie frontale × Cx) dominano i consumi oltre i 100 km/h.",

    "tip_8_title": "Pressione gomme 'pieno carico'",
    "tip_8_impact": "+3-7 % di autonomia",
    "tip_8_what": "Gonfiate al valore 'pieno carico' del libretto (spesso +0,2-0,3 bar rispetto all'uso quotidiano). Misurate a freddo, prima della partenza.",
    "tip_8_nuance": "La regola del '+0,3 bar a caldo' dipende dal modello e dal tempo di marcia — idealmente misurate sempre a freddo in stazione.",
    "tip_8_why": "La resistenza al rotolamento rappresenta il 20-25 % del consumo autostradale; 0,5 bar in meno costano già il 5 % di autonomia.",

    "tip_9_title": "Climatizzatore: massimo 5-7 °C di differenza con l'esterno",
    "tip_9_impact": "Fino a −30 % sul consumo del climatizzatore",
    "tip_9_what": "Con 35 °C fuori, mirate a 27-29 °C dentro, non 20 °C. Usate prima ventilazione e parasole, poi alzate l'AC.",
    "tip_9_nuance": "Con alta umidità passate al modo 'deumidificare' invece di freddo aggressivo — più efficace ed economico.",
    "tip_9_why": "Il compressore del climatizzatore consuma in proporzione al gradiente di temperatura — dimezzando il gradiente, quasi dimezzate il consumo AC.",

    "tip_10_title": "Prima di partire: caccia agli stand-by + boiler",
    "tip_10_impact": "30-90 € risparmiati in 15 giorni di assenza",
    "tip_10_what": "Staccate router, decoder, TV, caricatori, macchine da caffè e mettete lo scaldabagno elettrico su 'spento' o 'vacanze'.",
    "tip_10_nuance": "Lasciate accesi: allarme, domotica critica, frigo/congelatore, telecamere. Un congelatore pieno consuma meno di uno vuoto.",
    "tip_10_why": "Una casa media perde 50-100 W in stand-by permanente e uno scaldabagno mal coibentato 1-3 kWh/giorno per perdite termiche.",

    "faq_h2": "Domande frequenti",
    "faq_q1": "Su un viaggio di 1.500 km, quanto posso davvero risparmiare?",
    "faq_a1": "Tra 80 e 150 € a seconda dell'auto e della partenza: 30-50 € evitando le HPC autostradali, 20-40 € andando a 115 invece di 130 km/h (una sosta in meno), 10-30 € togliendo il box da tetto e 30-90 € a casa eliminando gli stand-by per due settimane.",
    "faq_q2": "Il precondizionamento funziona su ogni EV?",
    "faq_a2": "No. Tesla, Hyundai/Kia E-GMP (Ioniq 5/6, EV6, EV9), BMW, MG e Porsche lo offrono automatico tramite navigatore. Su Renault, Peugeot, Citroën e Fiat è in distribuzione — verificate 'precondizionamento batteria' nel menu ricarica.",
    "faq_q3": "Meglio ricaricare al 100 % prima di partire o fermarsi in viaggio?",
    "faq_a3": "Caricare al 100 % a casa la sera prima (tariffa notturna) è quasi sempre più economico di una colonnina pubblica. In viaggio restate nella finestra 10-80 %: lì la colonnina dà piena potenza e il costo totale tempo + energia è minimo.",
    "faq_q4": "Devo davvero staccare il router e spegnere lo scaldabagno?",
    "faq_a4": "Sì, entrambi. Un router consuma 10-20 W continui (circa 3-7 kWh in 15 giorni). Uno scaldabagno elettrico da 200 L perde 1-3 kWh/giorno per perdite termiche se nessuno lo usa: 15-45 kWh risparmiati in due settimane, senza disagio al ritorno (torna a temperatura in 4-6 h).",
    "faq_q5": "Un portabici posteriore è davvero meglio di uno da tetto?",
    "faq_a5": "Sì, quasi sempre. Un portabici al gancio aggiunge il 3-8 % di consumo (a seconda del numero di bici), contro il 15-30 % per uno da tetto o un box. La differenza si vede già al primo pieno.",

    "disclaimer": "Gli ordini di grandezza indicati sono medie osservate su veicoli recenti (Tesla Model 3/Y, Hyundai Ioniq 5/6, Kia EV6, Renault Megane E-Tech, Peugeot e-3008, BMW iX1). I risparmi reali dipendono dal modello, meteo, carico e profilo stradale. Fonti: ADEME, Consumer Reports, T&E, feedback utenti Moteurs.com.",
    "back_to_hub": "Torna all'hub vacanze",
    "cta_compare": "Confronta il vostro viaggio",
    "cta_recharge": "Scegliete una tessera di ricarica",
}

# ----------------------------------------------------------------------------
# Vérifications + écriture atomique
# ----------------------------------------------------------------------------

LOCALES = {
    "fr": FR, "en": EN, "nl": NL, "de": DE, "es": ES, "it": IT,
}

# Vérification : toutes les locales ont exactement les mêmes clés
ref_keys = set(FR.keys())
for loc, content in LOCALES.items():
    diff_missing = ref_keys - set(content.keys())
    diff_extra = set(content.keys()) - ref_keys
    if diff_missing or diff_extra:
        print(f"!! Désalignement {loc} : manquantes={diff_missing} extra={diff_extra}", file=sys.stderr)
        sys.exit(1)
print(f"OK : {len(ref_keys)} clés alignées sur les 6 locales.")

def atomic_write_json(path: Path, data: dict) -> None:
    """Écriture atomique d'un JSON, préserve l'encodage UTF-8 sans BOM, fin de ligne LF."""
    # Détecter les line endings du fichier original
    with open(path, "rb") as fh:
        raw = fh.read()
    is_crlf = b"\r\n" in raw
    text = json.dumps(data, ensure_ascii=False, indent=2)
    if is_crlf:
        text = text.replace("\n", "\r\n")
    # Préserver une newline finale si l'original en avait une
    if raw.endswith(b"\n") and not text.endswith(("\n", "\r\n")):
        text += "\r\n" if is_crlf else "\n"
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    try:
        with os.fdopen(fd, "wb") as fh:
            fh.write(text.encode("utf-8"))
        os.replace(tmp, str(path))
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise

for loc, content in LOCALES.items():
    path = MESSAGES / f"{loc}.json"
    if not path.exists():
        print(f"!! Fichier manquant : {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, "rb") as fh:
        existing = json.loads(fh.read().decode("utf-8"))

    # Insérer / remplacer le namespace ChecklistEV
    existing[NAMESPACE] = content
    atomic_write_json(path, existing)
    nb = len(content)
    print(f"  ✓ {loc}.json : ChecklistEV ({nb} clés) ajouté ({path.stat().st_size:>6} octets)")

print("Terminé.")
