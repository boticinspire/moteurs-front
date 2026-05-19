FROM python:3.12-slim

WORKDIR /app

# ── Dépendances système (curl + Chromium runtime pour Playwright) ─────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget gnupg ca-certificates \
    libnss3 libnspr4 \
    libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 \
    libxcb1 libxkbcommon0 \
    libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 \
    libasound2 libatspi2.0-0 libglib2.0-0 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# ── Dépendances Python ────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Chromium via Playwright (après pip pour utiliser la version installée) ────
RUN playwright install chromium

# ── Code source ───────────────────────────────────────────────────────────────
COPY . .

EXPOSE 8000

# Production : $PORT injecté par Railway. En local Docker : PORT=8000 par défaut.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
