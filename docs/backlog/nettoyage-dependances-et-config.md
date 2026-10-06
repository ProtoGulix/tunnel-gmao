# Nettoyage des dépendances et de la configuration

- python-jose : signalé comme inutilisé dans l'ancien CLAUDE.md, absent de requirements.txt aujourd'hui. Vérifier puis rayer.
- DIRECTUS_KEY, DIRECTUS_* : variables mortes depuis la v3. Retirer de la doc et du README (qui cite encore admin@tunnel.local / admin).
- constants.py get_active_status_ids() : import lazy, jamais appelée. Supprimer si toujours vrai.
