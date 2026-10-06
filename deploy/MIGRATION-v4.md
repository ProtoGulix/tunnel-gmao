# Basculer une instance v4 vers la stack Compose

Pour une instance existante (ancienne architecture : base PostgreSQL 15 `directus`
qui contient aussi les 26 tables `directus_*`, rôle superuser `directus`, révision
alembic `030_intervention_status_ref_code`). Sans perte de données ni de comptes :
utilisateurs, mots de passe (bcrypt et argon2, conservés tels quels), historique,
jetons de rafraîchissement.

**Ne jamais** lancer `docker compose up` (ni `up api`) avant l'étape 6 : l'api
exécuterait l'installation d'une base neuve et créerait un nouvel administrateur.
**Ne jamais** lancer `alembic upgrade` sur l'ancienne base.

Prévoir une interruption de service de quelques minutes (taille de la base dev : 2 Mo
de dump). L'ancienne base n'est jamais modifiée : le retour arrière est toujours
possible (section finale).

## 0. Prérequis

- La v4 est à la révision `030_intervention_status_ref_code`. Contrôle :
  `psql -U directus -d directus -Atc "SELECT version_num FROM alembic_version_backend"`.
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
   n'est pas à la révision `030_intervention_status_ref_code` ou n'a aucun admin actif ;
2. dump complet de la source (session en lecture seule) dans `backups-v4/` ;
3. restauration en **une seule transaction** par `tunnel_owner`, sans les tables
   `directus_*` ni `alembic_version*` ; échec = base cible inchangée ;
4. compare `pg_dump --schema-only` de la base restaurée avec celui d'une base neuve
   installée par `backend/db/schema.sql` (révision 0001), mêmes exclusions. **Diff non
   vide : le diff est affiché et le script s'arrête, sans stamp** ;
5. compare, pour chacune des tables métier, le nombre de lignes avec la source, et
   l'empreinte de `tunnel_user` (hachages inclus) ; vérifie
   `intervention_status_ref.code = id` ;
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
- **Diff de schéma avant stamp** : un stamp sur un schéma différent ferait croire à
  alembic que la base est conforme et masquerait une dérive.
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

Le bootstrap doit afficher : migrations appliquées (rien à faire, base déjà à la tête),
`rôle applicatif tunnel_app prêt (create)`, `un admin actif existe déjà : rien à créer`,
`base prête`. Aucun mot de passe n'est affiché : aucun compte n'est créé. Le bootstrap
est rejouable à chaque redémarrage.

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
