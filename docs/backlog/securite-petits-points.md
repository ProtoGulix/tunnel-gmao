# Petits points de sécurité (tri du 2026-11-19)

Réserves des étapes 2, 3c, 3d, 5 et de la bascule, toujours vraies. Gravité faible.

- Nom du CSV des commandes fournisseur non assaini dans Content-Disposition :
  backend/api/supplier_orders/routes.py:167, backend/config/export_templates.py:241-262.
- Compose : `db` sans no-new-privileges ni cap_drop ; `api` sans read_only
  (deploy/docker-compose.yml:8-27).
- Mobile : polices Google chargées depuis l'extérieur (mobile/index.html:11-13), autorisées
  par la CSP (deploy/nginx/tunnel.conf.template:26). Contraire au principe 5.
- Mot de passe du premier admin affiché dans les logs (backend/scripts/bootstrap.py:279-290),
  sans changement forcé ni consigne de purge (deploy/README.md:20-31).
- Aucun test ne fige la liste des routes publiques (backend/api/auth/middleware.py:15-24).
- deploy/web.Dockerfile.dockerignore ne liste ni archives-bascule ni bascule.conf.
- Bascule : `inspect.json` d'archive écrit sans chmod (deploy/basculer-production.sh:276).
- En-têtes de sécurité posés deux fois (backend/api/app.py:142-155 et nginx), avec une
  Permissions-Policy divergente (camera=() contre camera=(self)).
