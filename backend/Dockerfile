# Image de l'API Tunnel (ADR 0002). Contexte de build : backend/.
# Deux étapes : les dépendances Python sont installées dans un venv, puis copiées
# dans l'image finale, qui ne contient ni pip ni compilateur de notre fait.
# Toutes les dépendances ont des wheels binaires (psycopg2-binary, bcrypt, Pillow...) :
# aucun gcc n'est nécessaire, même dans l'étape de construction.

FROM python:3.12-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
COPY requirements.txt .
RUN /opt/venv/bin/pip install -r requirements.txt

FROM python:3.12-slim
# Bibliothèques système de WeasyPrint (export PDF) : Pango, HarfBuzz, polices.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Utilisateur non root, sans shell de connexion ni répertoire personnel.
RUN useradd --system --uid 10001 --no-create-home --shell /usr/sbin/nologin tunnel

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app
COPY . /app
RUN chmod 755 /app/docker-entrypoint.sh

USER tunnel
EXPOSE 8000

# /health est public. start-period large : le bootstrap (migrations) précède uvicorn.
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=4).status == 200 else 1)"]

ENTRYPOINT ["/app/docker-entrypoint.sh"]
