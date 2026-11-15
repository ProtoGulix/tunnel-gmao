# BASC-04. Script de bascule automatique de la production

- Statut : faite (2026-11-15), essai sur la vraie production à venir
- Agent : db-dev
- Branche : fix/bascule-depuis-3.57
- Dépend de : BASC-01 à BASC-03, spike 0003, `deploy/MIGRATION-v4.md`
- Périmètre d'écriture : nouveau `deploy/basculer-production.sh`, nouveau
  `deploy/bascule.conf.example`, `deploy/MIGRATION-v4.md` (section qui présente le
  script, la procédure manuelle reste), `.gitignore` (bascule.conf, dossier d'archive),
  `CHANGELOG.md`. Exclus : `migrate-from-v4.sh` et `rattrapage-029.sql` (appelés tels
  quels ; un défaut trouvé est signalé, pas corrigé), `backend/`, docker-compose.

## Contexte

L'utilisateur veut une bascule automatique de la production 3.57.0 vers la v5, faite
par un agent sur le serveur. Les anciens services seront supprimés ensuite : leur
configuration doit être récupérée avant. Le dépôt est public : rien de propre au
serveur dans le script, tout passe par `deploy/bascule.conf` (hors git). Décisions de
l'utilisateur du 2026-11-15 : le conteneur exposé est l'ancien front ; deux
confirmations par défaut.

## Critères d'acceptation

- [x] Paramètres lus dans `deploy/bascule.conf` (modèle commenté
      `bascule.conf.example`) : conteneur de l'ancienne base, utilisateur et nom de la
      base, conteneur de l'ancienne API, conteneur exposé, liste des conteneurs à
      arrêter, liste des conteneurs dont la configuration est archivée, ADMIN_EMAIL,
      PUBLIC_URL. Paramètre manquant : arrêt avant toute action.
- [x] Étape 1, contrôles sans effet : docker et compose v2, `.env` et volume de la
      nouvelle stack absents, conteneurs listés existants, ancienne base joignable à la
      révision 029 ou 030, espace disque suffisant pour le dump.
- [x] Étape 2, sauvegarde : `pg_dump -Fc` complet de l'ancienne base dans un dossier
      d'archive daté en `chmod 700`, taille non nulle.
- [x] Étape 3, archive des configurations, pour chaque conteneur listé :
      `docker inspect` complet, variables d'environnement, et, s'il a l'étiquette
      `com.docker.compose.project.working_dir`, copie des `.env*` et
      `docker-compose*.y*ml` de ce dossier ; copie des fichiers ou dossiers montés
      (bind mounts) de moins de 50 Mo, au-delà listés seulement. Inventaire écrit.
      Aucun secret affiché ni journalisé.
- [x] Étape 4, reprise des clés : depuis les variables de l'ancienne API, seules
      `JWT_SECRET_KEY`, `MAIL_ENABLED`, `SMTP_*`, `ACCESS_TOKEN_EXPIRE_MINUTES`,
      `REFRESH_TOKEN_EXPIRE_HOURS` sont reportées dans le `.env` créé par `install.sh` ;
      `API_ENV=production`, `PUBLIC_URL`, `HTTP_BIND` et `HTTP_PORT` repris de la
      publication du conteneur exposé (`docker inspect`). Clé attendue introuvable :
      signalée. Autres variables : noms seulement dans le rapport.
- [x] Étape 5, coupure : confirmation `OUI` (sauf `--sans-confirmation`), puis
      `docker stop` des conteneurs à arrêter, liste mémorisée pour le retour arrière.
      Rien n'est supprimé.
- [x] Étape 6 : `docker compose build`, `up -d db`, raccordement de l'ancienne base au
      réseau de la nouvelle stack, `SOURCE_URL` construite depuis les variables de
      l'ancienne base (mot de passe jamais affiché), `migrate-from-v4.sh` avec le dump
      de l'étape 2 (`--dump-file`).
- [x] Étape 7 : confirmation `OUI`, `docker compose up -d`, puis contrôles : révision
      `0013_motifs_cloture`, `/api/health` 200, `/api/docs` non 200, `tunnel_app` sans
      superuser, comptes, interventions et actions identiques à l'ancienne base, motifs
      TASK_* présents.
- [x] Retour arrière automatique en cas d'échec après l'étape 5 : `docker compose
      down -v` de la nouvelle stack, déraccordement de l'ancienne base, `docker start`
      des conteneurs arrêtés ; l'archive est conservée. Option `--retour-arriere` pour
      le faire à la main ensuite, avec un avertissement sur les saisies perdues.
- [x] Rapport final dans l'archive et à l'écran : ce qui a été fait, clés reprises
      (noms), clés non reprises (noms), ports libérés par les anciens conteneurs (un
      domaine Cloudflare qui y pointait, par exemple le mobile, est à rediriger vers
      `/m`), reste à faire à la main (Grafana, clients MCP, Directus, cache des postes,
      Cloudflare Access, suppression des anciens conteneurs et de l'archive).
- [x] Essai réel sur la machine de dev, sans toucher aux projets `tunnel` et
      `tunnel-repetition` : fausse production construite pour l'essai (conteneur
      `rep-bascule-source` comme ancienne base, faux conteneurs d'API et de fronts
      `nginx:alpine` avec étiquettes Compose, `.env` factices et port publié sur
      127.0.0.1:8095), nouvelle stack sous un nom de projet propre. Un passage complet
      réussi, puis un échec provoqué après l'étape 5 qui déclenche le retour arrière
      (faux conteneurs redémarrés, nouvelle stack supprimée).
- [x] `bash -n` propre ; scripts/check.sh vert ; CHANGELOG à jour.

## Compte rendu final

Fait (db-dev, worktree) : `deploy/basculer-production.sh` (7 étapes, retour arrière
automatique par trap après la coupure seulement, `--retour-arriere`,
`--sans-confirmation`, `--conf`), `bascule.conf.example`, section « Bascule
automatique » de MIGRATION-v4.md, .gitignore, CHANGELOG. Refus si un conteneur porte
déjà l'étiquette du projet, si `.env`, volume ou réseau existent, si le port est tenu
par un conteneur hors liste. Mot de passe de l'ancienne base par PGPASSWORD, jamais en
ligne de commande. Écart accepté par l'agent principal : second dump après la coupure,
restauré par migrate-from-v4.sh (une saisie entre le premier dump et l'arrêt n'est ni
perdue ni bloquante) ; le premier reste dans l'archive.

Essai (fausse production, projet `tunnel-essai-bascule`, port 8095) : passage complet
réussi (révision 0013, santé 200, /api/docs 401, comptages identiques, clés factices
reprises, valeurs absentes du rapport) ; échec injecté (`BASCULE_ECHEC_APRES_COUPURE=1`)
suivi d'un retour arrière complet ; refus vérifiés (projet `tunnel`, paramètre
manquant, `.env` existant, réponse « non »). Nettoyage complet ; stacks `tunnel` et
`tunnel-repetition` non touchées, `rep-bascule-source` seulement lu (vérifié).

Commandes en échec (agent) : deux commandes composées refusées par le harnais,
relancées ; shellcheck absent (code 1). Défauts hors périmètre :
`docs/backlog/suites-bascule-automatique.md`.

Contrôle de l'agent principal : diff conforme au périmètre ; `down -v` toujours en
`-p` explicite ; ajout du déraccordement de l'ancienne base juste après la migration
(elle restait sinon joignable depuis le réseau de la nouvelle stack). NON VÉRIFIÉ :
shellcheck, base source à 030, vraie production (authentification de l'ancienne base,
plusieurs ports publiés : seul le premier est repris).

Essai final (2026-11-15, db-dev, commit 2111201, même fausse production) : passage
complet 7/7 (révision 0013, santé 200, /api/docs 401, comptages identiques) et ancienne
base déraccordée du réseau de la nouvelle stack après la migration (vérifié par docker
inspect) ; échec injecté après ce déraccordement : retour arrière complet, sans erreur.
Un premier lancement a échoué à l'étape 7 parce que la fausse clé JWT faisait moins de
32 caractères (l'API refuse de démarrer) : retour arrière correct. Corrections ensuite,
non rejouées en exécution complète (bash -n seul) : refus à l'étape 4, avant la coupure,
d'une JWT_SECRET_KEY de moins de 32 caractères ; drapeau ENV_CREATED posé avant
install.sh ; chmod 700 limité au dossier daté (revue). Reviewer : APPROUVÉ.
