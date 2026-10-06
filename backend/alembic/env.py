"""
alembic/env.py - Configuration de l environnement Alembic (tunnel-backend)
L URL de connexion est lue dans DATABASE_URL_OWNER (role proprietaire, qui
cree les objets), a defaut DATABASE_URL, dans l environnement ou le .env.
Table de version dediee : alembic_version_backend (evite les conflits avec tunnel-db).
"""

import os
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, pool

from alembic import context

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None
_VERSION_TABLE = "alembic_version_backend"


def get_url() -> str:
    url = os.environ.get("DATABASE_URL_OWNER") or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL_OWNER (ou DATABASE_URL) manquant")
    return url.replace("postgres://", "postgresql+psycopg2://", 1).replace(
        "postgresql://", "postgresql+psycopg2://", 1
    )


def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        transaction_per_migration=True,
        version_table=_VERSION_TABLE,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(get_url(), poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            transaction_per_migration=True,
            version_table=_VERSION_TABLE,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
