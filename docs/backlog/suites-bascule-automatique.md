# Suites du script de bascule automatique (BASC-04)

Défauts relevés par l'agent pendant l'essai du 2026-11-15, hors périmètre de BASC-04 :

1. `deploy/docker-compose.yml` ne transmet pas `ACCESS_TOKEN_EXPIRE_MINUTES` ni
   `REFRESH_TOKEN_EXPIRE_HOURS` à l'api : reprises dans `.env` par la bascule, sans
   effet (le rapport le dit).
2. `image: tunnel-api:local` et `tunnel-web:local` fixes dans le compose : un build d'un
   autre projet sur la même machine déplace l'étiquette des autres stacks. Sans effet
   avec une seule stack.
3. `migrate-from-v4.sh` : `SOURCE_URL` avec mot de passe visible par `ps` quand on suit
   la procédure manuelle ; avec un `DB_EXEC` personnalisé, la garde « l'api tourne »
   est désactivée ; l'aide annonce 7 étapes et lit des lignes fixes (`sed -n '2,36p'`).
4. `deploy/web.Dockerfile.dockerignore` : ajouter `deploy/archives-bascule/` et
   `deploy/bascule.conf` (non copiés dans l'image, mais dans le contexte de build).
5. Rapport : les variables propres à l'image (`PATH`, `NGINX_*`…) apparaissent parmi
   les variables non reprises, à filtrer.
