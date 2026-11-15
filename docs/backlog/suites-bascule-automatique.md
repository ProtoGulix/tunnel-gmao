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

Constats de la bascule réelle de la production (2026-11-15, 3.57.0 vers 5.3.1, réussie) :

6. Rapport : la ligne « Directus : arrêté avec les anciens services » est fixe. Elle est
   fausse si le conteneur Directus n'est pas dans `CONTENEURS_A_ARRETER` (cas de la
   prod : il tournait encore). Lister les conteneurs encore Up qui publient un port
   (dont l'ancienne base) au lieu de cette phrase.
7. Archive : `inspect.json` et les autres fichiers sont écrits en 664 (umask du shell)
   alors qu'ils contiennent des secrets ; seul le dossier en 700 les protège. Écrire
   l'archive sous `umask 077`.
8. Coupure : les conteneurs arrêtés gardent leur politique de redémarrage. En `always`,
   ils redémarrent au prochain démarrage de Docker (ancienne base de nouveau exposée,
   ancien front sur le port repris par la nouvelle stack). Passer `docker update
   --restart=no` à la coupure, et rétablir la politique d'origine au retour arrière.
9. Une ligne mal formée de l'ancien `.env` (`192.168.1MAIL_ENABLED=false`) fait signaler
   la clé comme introuvable : sans effet ici (valeur false, défaut de la v5), mais le
   rapport pourrait signaler les noms de variables invalides.
10. Le dossier cible propre (`~/DEV/tunnel-gmao`) était occupé par l'ancien clone : la
    procédure peut dire de cloner directement dans le dossier définitif, sur `main`
    (pas `git checkout` d'un tag, sinon `git pull` échoue), et indiquer `docker compose
    stop`, `mv`, `up -d` pour un déplacement après coup.
