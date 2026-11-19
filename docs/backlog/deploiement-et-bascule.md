# Déploiement et scripts de bascule (tri du 2026-11-19)

Réserves de BASC-04 et de l'étape 3c, toujours vraies ; la bascule réelle est faite
(2026-11-15), ces scripts ne servent plus qu'à une autre installation venant de la v4.

- Étiquettes d'image fixes `tunnel-api:local`, `tunnel-web:local` (deploy/docker-compose.yml:31,59).
- deploy/migrate-from-v4.sh : mot de passe visible par `ps` (l.31, documenté), garde
  désactivée avec DB_EXEC (l.119), aide lue sur des lignes fixes (l.65).
- deploy/basculer-production.sh : variables d'image non filtrées dans le rapport (l.346),
  ligne « Directus : arrêté » fixe (l.462), clés mal formées de l'ancien .env non signalées
  (l.336-346), pas de `docker update --restart=no` sur les conteneurs coupés.
- deploy/MIGRATION-v4.md sans la procédure de clonage dans le dossier définitif.
- Action de l'utilisateur sur le serveur de production : vérifier que les anciens
  conteneurs coupés ne redémarrent pas avec Docker (`restart: always`).
