# Basculer une instance v4 vers la stack Compose

Pour une instance existante (ancienne architecture : base PostgreSQL 15 `directus`
qui contient aussi les 26 tables `directus_*`, rôle superuser `directus`, révision
alembic `030_intervention_status_ref_code`, ou production 3.57.0 à la révision
`029_home_view`, voir le prérequis). Sans perte de données ni de comptes :
utilisateurs, mots de passe (bcrypt et argon2, conservés tels quels), historique,
jetons de rafraîchissement.

**Ne jamais** lancer `docker compose up` (ni `up api`) avant l'étape 6 : l'api
exécuterait l'installation d'une base neuve et créerait un nouvel administrateur.
**Ne jamais** lancer `alembic upgrade` sur l'ancienne base.

Prévoir une interruption de service de quelques minutes (taille de la base dev : 2 Mo
de dump). L'ancienne base n'est jamais modifiée : le retour arrière est toujours
possible (section finale).

## Bascule automatique (basculer-production.sh)

`basculer-production.sh` enchaîne toute la procédure ci-dessous (sauvegarde, archive
des configurations, reprise des clés, coupure, migration, démarrage, contrôles) et
fait le retour arrière tout seul si quelque chose échoue après la coupure. La
procédure manuelle qui suit reste la référence et le recours.

```sh
cd tunnel-gmao/deploy
cp bascule.conf.example bascule.conf     # adapter : noms des conteneurs, adresse publique
./basculer-production.sh                 # deux confirmations « OUI » (coupure, démarrage)
```

- `bascule.conf` (jamais versionné) désigne : la base et l'API de l'ancienne instance,
  le conteneur exposé (l'ancien front : son adresse et son port sont repris), les
  conteneurs à arrêter, ceux dont la configuration est archivée, `ADMIN_EMAIL` et
  `PUBLIC_URL`. Un paramètre manquant arrête le script avant toute action.
- Contrôles sans effet d'abord : pas de `.env`, pas de volume ni de conteneur du
  projet Compose de la nouvelle stack (`COMPOSE_PROJECT_NAME`, défaut `tunnel`), ancienne
  base à la révision 029 ou 030, espace disque.
- Deux dumps sont pris dans `deploy/archives-bascule/AAAAMMJJ-HHMMSS/` (mode 700) : l'un
  avant la coupure, l'autre après, c'est ce dernier qui est migré (aucune saisie perdue).
  L'archive contient aussi, par conteneur : `docker inspect`, variables d'environnement,
  `.env*` et `docker-compose*.yml` du dossier du projet, montages de moins de 50 Mo, plus
  un inventaire. Elle contient des secrets : à supprimer après validation.
- Seules `JWT_SECRET_KEY`, `MAIL_ENABLED`, `SMTP_*`, `ACCESS_TOKEN_EXPIRE_MINUTES` et
  `REFRESH_TOKEN_EXPIRE_HOURS` sont reprises dans le `.env`, avec `API_ENV=production` et
  l'adresse et le port publiés. Les noms des autres variables sont listés dans le rapport.
  (`docker-compose.yml` ne transmet pas encore les deux durées de jeton à l'api.)
- Les anciens conteneurs sont arrêtés, jamais supprimés. Le rapport
  (`rapport.txt`) liste ce qui reste à faire à la main : Grafana, clients MCP, Directus,
  cache des postes, Cloudflare Access, domaine qui pointait sur l'ancien mobile (à
  rediriger vers `/m`), suppression des anciens conteneurs et de l'archive.
- Retour arrière manuel, plus tard : `./basculer-production.sh --retour-arriere`. Il
  supprime la nouvelle stack et son volume (`down -v` du seul projet de la bascule) et
  redémarre les anciens conteneurs : les saisies faites entre-temps sont perdues.
- Pour l'essayer sans risque, ne pas le lancer sur la production : prévoir des conteneurs
  factices et un `COMPOSE_PROJECT_NAME` propre. `BASCULE_ECHEC_APRES_COUPURE=1` provoque
  un échec à l'étape 7 pour voir le retour arrière.

## 0. Prérequis

- La v4 est soit à la révision `030_intervention_status_ref_code`, soit (production
  3.57.0) aux deux lignes `002_create_missing_tables` et `029_home_view`, rien d'autre.
  Contrôle :
  `psql -U directus -d directus -Atc "SELECT version_num FROM alembic_version_backend"`.
  Une source à 029 est rattrapée sur la copie, jamais sur la source (voir l'étape 4).
- Les services qui lisent l'ancienne base ou appellent l'ancienne API ne suivent pas
  la bascule : Grafana (sources de données PostgreSQL), clients MCP, scripts, sauvegardes
  de l'ancienne base. Les repérer avant la coupure et les reconfigurer vers la nouvelle
  stack (nouvelle URL d'API, nouvelle clé d'API) ; la nouvelle base n'est pas publiée
  sur le réseau.
- Un clone du monorepo, Docker et Compose v2 sur la machine cible.
- Le conteneur de la base v4 est joignable par une URL, par exemple
  `postgresql://directus:MOT_DE_PASSE@HOTE:5432/directus`, depuis le conteneur `db`
  de la nouvelle stack (le dump et les lectures s'exécutent dans ce conteneur).

## 1. Sauvegarde complète (indépendante du script)

```sh
mkdir -p ~/sauvegardes-v4 && chmod 700 ~/sauvegardes-v4
docker exec NOM_CONTENEUR_BASE_V4 pg_dump -U directus -d directus -Fc > ~/sauvegardes-v4/v4-avant-bascule.dump
ls -l ~/sauvegardes-v4/v4-avant-bascule.dump
```

Copier aussi le `.env` (ou la configuration) de l'ancienne API : elle contient la
clé de signature des jetons. Conserver ces fichiers hors de la machine : ils
contiennent toutes les données.

## 2. Arrêter l'ancienne API

Pour qu'aucune écriture n'ait lieu entre le dump et la restauration. Selon
l'installation (service `systemd`, conteneur, ou processus uvicorn) :

```sh
docker stop NOM_CONTENEUR_API_V4        # ou : sudo systemctl stop tunnel-api
```

Laisser la base v4 démarrée : elle est la source. Arrêter aussi Directus s'il tourne.

## 3. Préparer la nouvelle stack, base seule

```sh
cd tunnel-gmao/deploy
./install.sh admin@votre-entreprise.fr       # crée .env (secrets aléatoires)
docker compose build api                     # image utilisée pour le stamp
docker compose up -d db                      # SEULEMENT db, jamais api ni web
docker compose ps                            # db doit être « healthy »
```

L'adresse de `install.sh` n'est pas utilisée pour créer un compte (des
administrateurs existent déjà) ; elle remplit seulement la variable obligatoire
`ADMIN_EMAIL`.

Pour conserver les sessions déjà ouvertes, mettre dans `.env` l'ancienne valeur de
`JWT_SECRET_KEY` (sinon chaque utilisateur se reconnectera une fois).

## 4. Dump, restauration, vérifications et stamp (script)

```sh
export SOURCE_URL='postgresql://directus:MOT_DE_PASSE@HOTE:5432/directus'
./migrate-from-v4.sh
```

Pour restaurer la sauvegarde de l'étape 1 au lieu d'un nouveau dump, ajouter
`--dump-file` (`SOURCE_URL` reste nécessaire : elle sert aux contrôles en lecture
seule, révision, nombres de lignes, empreinte des comptes) :

```sh
./migrate-from-v4.sh --dump-file ~/sauvegardes-v4/v4-avant-bascule.dump
```

Le script, dans l'ordre :

1. refuse de continuer si la base cible n'est pas vide, si l'api tourne, si la source
   n'est pas à la révision `030_intervention_status_ref_code` ou à
   `002_create_missing_tables` + `029_home_view`, ou n'a aucun admin actif ;
2. dump complet de la source (session en lecture seule) dans `backups-v4/` ;
3. restauration en **une seule transaction** par `tunnel_owner`, sans les tables
   `directus_*` ni `alembic_version*` ; échec = base cible inchangée. Source à 029 :
   `rattrapage-029.sql` est ensuite appliqué à la **cible** (une transaction, arrêt à la
   première erreur). Il ajoute ce que la production 3.57.0 n'a pas (trois tables de
   référence et leurs données de départ, six colonnes et leurs clés et index sur
   `intervention_request`, fonctions et déclencheur de mise à jour, élargissement de
   `role_home_view.home_view`, nom de la clé primaire de `intervention_task`, codes de
   `intervention_status_ref`). Seule suppression : les 3 clés étrangères de l'arbre des
   équipements sur `machine`, que la migration 0003 recrée aussitôt en
   `ON DELETE RESTRICT` (deux portent déjà le nom qu'elle crée). Aucune autre
   contrainte, aucun index, aucune donnée n'est supprimé ;
4. contrôle, par le catalogue PostgreSQL, que la cible contient **au moins** le schéma
   d'une base neuve installée par `backend/db/schema.sql` : chaque colonne (type,
   nullabilité, défaut), contrainte, index, fonction, déclencheur et vue de la référence
   doit exister à l'identique. **Un manque ou un écart est affiché et le script s'arrête,
   sans stamp.** Les contraintes et index en plus (l'ancienne base en a bien plus que la
   référence) sont comptés et conservés, sans bloquer ;
5. compare, pour chacune des tables métier, le nombre de lignes avec la source, et
   l'empreinte de `tunnel_user` (hachages inclus) ; vérifie
   `intervention_status_ref.code = id`. Source à 029 : les trois tables créées par le
   rattrapage sont exclues de la comparaison et vérifiées contre les lignes de
   `seed_reference.sql` ;
6. `alembic stamp 0002_donnees_reference` (rôle propriétaire, via l'image api, sans
   bootstrap), puis relit `alembic_version_backend`.

Résultat attendu : `[migrate-v4] 7/7 terminé`. Toute autre sortie : ne rien démarrer,
lire le message, et au besoin revenir en arrière.

### Pourquoi ces choix

- **Tables `directus_*` exclues** : le spike 3a (ADR 0006) a vérifié au catalogue qu'aucune
  clé étrangère, vue, fonction ni séquence de Tunnel n'en dépend ; elles restent dans le
  dump complet de l'étape 1 si Directus doit être consulté.
- **Restauration par `tunnel_owner`** (`--no-owner --no-privileges`) : il possède tous les
  objets (il lancera les migrations futures), et le rôle `directus` (superuser) n'existe pas
  dans la nouvelle base. `tunnel_app` est créé par le bootstrap avec des droits limités.
- **Contrôle de schéma avant stamp** : un stamp sur un schéma incomplet ferait croire à
  alembic que la base est conforme et masquerait une dérive. Le contrôle est « au moins
  la référence » car l'ancienne base a gardé des contraintes et des index que la
  référence a perdus (spike 0003) : les supprimer serait une perte d'intégrité.
- **Rattrapage sur la cible, jamais sur la source** : la production n'est qu'en lecture ;
  le retour arrière reste la suppression du volume de la nouvelle stack.
- **`alembic_version` (ancienne) et `alembic_version_backend`** non restaurées : le stamp
  recrée `alembic_version_backend` avec la seule révision `0002_donnees_reference`.
  **`schema_migrations`** (historique hérité) fait partie du schéma 0001 : elle est
  restaurée telle quelle, sans effet sur l'application.

## 5. Contrôler à la main (facultatif, recommandé)

```sh
docker compose exec db psql -U tunnel_owner -d tunnel -c "SELECT version_num FROM alembic_version_backend"
docker compose exec db psql -U tunnel_owner -d tunnel -c "SELECT (SELECT count(*) FROM tunnel_user) AS comptes, (SELECT count(*) FROM intervention) AS interventions, (SELECT count(*) FROM intervention_action) AS actions"
```

Comparer aux mêmes requêtes sur la base v4.

## 6. Démarrer la nouvelle stack

```sh
docker compose up -d
docker compose logs api | grep bootstrap
```

Le script a stampé la base à la révision `0002_donnees_reference` : le bootstrap applique
donc les migrations suivantes jusqu'à la tête (0003 à 0013 : arbre des
équipements, audit centralisé, motifs, règles d'audit), puis doit afficher
`rôle applicatif tunnel_app prêt (create)`, `un admin actif existe déjà : rien à créer`,
`base prête`. Ces migrations modifient la base (jamais l'ancienne) : c'est attendu.
Aucun mot de passe n'est affiché : aucun compte n'est créé. Le bootstrap est rejouable à
chaque redémarrage. Les motifs de clôture des tâches sont posés par la migration 0013.

## 7. Vérifications finales

```sh
curl -s http://127.0.0.1:8080/api/health          # 200, "database":"connected"
docker compose exec db psql -U tunnel_owner -d tunnel -Atc "SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'tunnel_app'"   # tunnel_app|f
```

Puis se connecter sur <http://127.0.0.1:8080> avec un compte existant (mot de passe
inchangé) et ouvrir une intervention. Garder l'ancienne base v4 arrêtée mais intacte
quelques jours, puis la supprimer.

## 8. Supprimer le dump

Le dossier `deploy/backups-v4/` contient une copie complète de la base v4 : données de
l'usine et hachages des mots de passe. Une fois la nouvelle stack validée et une
sauvegarde régulière en place, supprimez-le (`rm -rf deploy/backups-v4`) ou
chiffrez-le avant de l'archiver hors de la machine. Il n'est jamais versionné.

## Retour arrière

L'ancienne base n'a subi que des lectures. Quel que soit le point d'échec :

```sh
cd tunnel-gmao/deploy
docker compose down -v          # efface le volume de la NOUVELLE stack, jamais la v4
docker start NOM_CONTENEUR_API_V4   # ou : sudo systemctl start tunnel-api
```

Si la v4 elle-même a été endommagée, restaurer `v4-avant-bascule.dump` (étape 1) dans une
base vide avec `pg_restore -U directus -d directus --no-owner`. Une fois la nouvelle stack
en service et des écritures faites, le retour à la v4 perdrait ces écritures : ne le faire
qu'avec cette connaissance.
