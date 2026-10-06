# Suites de l'étape 3c (réserves du reviewer, 2026-10-06)

- Tables d'audit falsifiables par l'application : tunnel_app a UPDATE et DELETE sur audit_log, permission_audit_log et alembic_version_backend. REVOKE UPDATE, DELETE sur les tables d'audit (et INSERT seul), à traiter avec le chantier RBAC (étape 5).
- Mot de passe du premier admin dans les logs Docker (stdout, json-file persistant sur l'hôte) : documenter le changement immédiat du mot de passe et la purge des logs ; obligation de changement à la première connexion (colonne à ajouter).
- Durcissement Compose : security_opt no-new-privileges et cap_drop sur db, read_only sur api.
- Mobile : polices Google Fonts chargées depuis l'extérieur (fuite d'IP vers un tiers, philosophie n°5) : auto-héberger les polices et resserrer le CSP.
- Données de référence héritées : purchase_status sans code, libellé ni ordre ; statuts d'intervention sans libellé ni couleur ; fautes et casse incohérente dans complexity_factor ; accents manquants dans audit_reason_code ; table legacy schema_migrations dans le schéma.
- Validation des emails : le login refuse les domaines réservés (.local, .test...), courants dans les réseaux internes d'usine. Décider s'il faut les accepter.
- Seed d'exemple optionnel (référentiels d'usine) après relecture par l'utilisateur (ADR 0006).
- Procédure de bascule de l'instance existante : alembic stamp 0002_donnees_reference après comparaison des schémas (étape 3f).
- Relance d'une API qui ne répond plus : la v4 avait un chien de garde systemd
  (tunnel-api-watchdog.timer, désactivé à la bascule du 2026-10-07). Dans Compose, un
  conteneur « unhealthy » n'est PAS redémarré par Docker : uvicorn sans --reload limite
  le risque (un worker en échec fait sortir le processus), mais un blocage resterait
  silencieux. À trancher : healthcheck + relance externe, ou acceptation documentée.
