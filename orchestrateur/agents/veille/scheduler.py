import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import get_settings
from agents.veille.agent import run_veille_toutes_sources
from agents.redaction.agent import run_redaction_batch
from agents.simulateur.agent import run_simulateur_update
from agents.alerte_gov.agent import surveiller_sources_gov
from agents.recharge.agent import run_recharge_batch

logger = logging.getLogger(__name__)
settings = get_settings()

scheduler = BackgroundScheduler(timezone="Europe/Paris")


def _parse_plage(plage: str) -> tuple[int, int]:
    """Parse '07:00-22:00' → (7, 22)."""
    debut, fin = plage.split("-")
    return int(debut.split(":")[0]), int(fin.split(":")[0])


def _calculer_heures(heures_actives: str, frequence: int) -> list[int]:
    """Répartit les N passages dans la plage horaire active."""
    debut, fin = _parse_plage(heures_actives)
    amplitude = fin - debut
    pas = amplitude // frequence
    return [debut + i * pas for i in range(frequence)]


def _lancer_veille():
    """Wrapper synchrone — cycle veille."""
    logger.info(f"[Scheduler] Cycle Veille — {datetime.now().strftime('%H:%M')}")
    asyncio.run(run_veille_toutes_sources())


def _lancer_redaction():
    """
    Wrapper synchrone — cycle rédaction.
    Déclenché 30 min après chaque cycle veille.
    Limite à 3 articles par cycle pour maîtriser les coûts Sonnet.
    """
    logger.info(f"[Scheduler] Cycle Rédaction — {datetime.now().strftime('%H:%M')}")
    result = asyncio.run(run_redaction_batch(limit=3))
    logger.info(
        f"[Scheduler] Rédaction terminée — "
        f"{result['articles_generes']} article(s) en attente de validation"
    )


def start_scheduler():
    heures = _calculer_heures(
        settings.veille_heures_actives,
        settings.veille_frequence_par_jour,
    )
    heures_str = ",".join(str(h) for h in heures)

    # Job 1 : Agent Veille (07h, 10h, 13h, 16h)
    scheduler.add_job(
        _lancer_veille,
        trigger=CronTrigger(hour=heures_str, minute=0),
        id="agent_veille",
        name="Agent Veille — scraping sources",
        replace_existing=True,
    )

    # Job 2 : Agent Rédaction — 30 min après chaque cycle veille
    scheduler.add_job(
        _lancer_redaction,
        trigger=CronTrigger(hour=heures_str, minute=30),
        id="agent_redaction",
        name="Agent Rédaction — génération articles",
        replace_existing=True,
    )

    # Job 3 : Agent Simulateur — 1x/jour à 08h00 (mise à jour prix énergie)
    scheduler.add_job(
        lambda: asyncio.run(run_simulateur_update()),
        trigger=CronTrigger(hour="8", minute=0),
        id="agent_simulateur",
        name="Agent Simulateur — mise à jour prix énergie",
        replace_existing=True,
    )

    # Job 4 : Agent Alerte Gov. — 1x/jour à 06h30 (avant le cycle veille)
    scheduler.add_job(
        lambda: asyncio.run(surveiller_sources_gov()),
        trigger=CronTrigger(hour="6", minute=30),
        id="agent_alerte_gov",
        name="Agent Alerte Gov. — surveillance sources officielles",
        replace_existing=True,
    )

    # Job 5 : Agent Recharge — 1x/semaine le lundi à 05h30
    # Avant les autres agents pour que les données soient fraîches en début de semaine.
    scheduler.add_job(
        lambda: asyncio.run(run_recharge_batch()),
        trigger=CronTrigger(day_of_week="mon", hour="5", minute=30),
        id="agent_recharge",
        name="Agent Recharge — mise à jour tarifs cartes recharge",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(f"[Scheduler] Démarré — jobs: {[j.id for j in scheduler.get_jobs()]}")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Arrêté")