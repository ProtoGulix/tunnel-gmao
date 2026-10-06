"""Configuration commune des tests.

Les variables d'environnement sont fixées AVANT tout import de api.*, car
api.settings lit l'environnement au chargement du module. Aucun test ne touche
la base de dev, qui contient des données réelles (CLAUDE.md section 11).
"""

import os

os.environ["API_ENV"] = "test"
os.environ["AUTH_DISABLED"] = "false"
os.environ["JWT_SECRET_KEY"] = "cle-de-test-uniquement-pour-pytest-0123456789"
os.environ["DATABASE_URL"] = "postgresql://test:test@127.0.0.1:1/inexistante"
