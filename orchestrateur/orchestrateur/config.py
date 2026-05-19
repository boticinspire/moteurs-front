from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str = "changeme"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Anthropic
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str

    # Scheduling
    veille_heures_actives: str = "07:00-22:00"
    veille_frequence_par_jour: int = 4

    # Redis
    redis_url: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
