from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from agents.veille.scheduler import start_scheduler, stop_scheduler
from routes import veille, articles, leads, simulateur, seo, social, alerte_gov, depannage, recharge, comparer_modeles

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage : lancement du scheduler Agent Veille
    start_scheduler()
    yield
    # Arrêt propre
    stop_scheduler()


app = FastAPI(
    title="Moteurs.com — Orchestrateur",
    description="API centrale de pilotage des agents IA Moteurs.com",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(veille.router,    prefix="/veille",    tags=["Agent Veille"])
app.include_router(articles.router,  prefix="/articles",  tags=["Articles"])
app.include_router(leads.router,      prefix="/leads",      tags=["Leads B2B"])
app.include_router(simulateur.router, prefix="/simulateur", tags=["Agent Simulateur"])
app.include_router(seo.router,        prefix="/seo",        tags=["Agent SEO"])
app.include_router(social.router,     prefix="/social",     tags=["Agent Social"])
app.include_router(alerte_gov.router, prefix="/alerte-gov", tags=["Agent Alerte Gov."])
app.include_router(depannage.router,  prefix="/depannage",  tags=["Assistant Dépannage"])
app.include_router(recharge.router,   prefix="/recharge",   tags=["Agent Recharge"])
app.include_router(comparer_modeles.router, prefix="/comparer-modeles", tags=["Comparateur Modèles"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "Moteurs.com Orchestrateur"}