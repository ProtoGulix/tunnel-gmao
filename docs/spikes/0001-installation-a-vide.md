# Spike 3a : installation à vide

Date : 2026-10-06. Rôle : db-dev. Statut : prototype, rien d'intégré. Dev en lecture seule (pg_dump, SELECT, \d). Base d'essai : conteneur jetable `tunnel-spike-db` (postgres:15), détruit à la fin. Prototypes : `docs/spikes/0001-installation-a-vide/` (`extract.sh` régénère les trois fichiers SQL depuis la dev).

## 1. Constat : la chaîne alembic actuelle échoue

Sur base vierge (`alembic upgrade head`) :

1. `Multiple head revisions` : deux têtes, `002_create_missing_tables` et `029_home_view`. `upgrade head` est refusé tel quel. (Constat nouveau, à corriger de toute façon.) L'alembic utilisé est celui du système (`~/.local/bin/alembic` 1.18.4) : il n'est pas installé dans `.venv`.
2. Avec `upgrade heads`, la baseline `000_baseline_clean` exécute `schema_current.sql` et plante sur `syntax error at or near "user"` (colonne `user` des tables Directus non guillemetée). Les contraintes UNIQUE malformées (`UNIQUE ({, c, o, d, e, })`, 43 occurrences de `UNIQUE` dans le fichier, 41 de ce type selon l'ADR 0006) ne sont même pas atteintes. La transaction est annulée : base restée vide.

Autre constat : la dev contient deux tables de version (`alembic_version` et `alembic_version_backend`, cette dernière étant celle de env.py) et une table legacy `schema_migrations` (20 lignes, historique d'un ancien système).

## 2. Schéma de départ : `01_schema.sql`

`pg_dump --schema-only --no-owner --no-privileges -T 'directus_*' -T alembic_version -T alembic_version_backend`, 4141 lignes, 70 tables, 2 vues, 26 fonctions de trigger/métier, 13 séquences non Directus.

- Extensions requises : `unaccent`, `uuid-ossp` (plpgsql est natif). Le rôle de migration doit pouvoir faire `CREATE EXTENSION` (sinon superuser, ou image avec extensions pré-créées). Les extensions sont dans le schéma `public`.
- Dépendances vers Directus : AUCUNE. Vérifié au catalogue : aucune FK mixte dans un sens ou l'autre, aucune vue, séquence ou fonction liée à directus_*, aucune mention « directus » dans le dump.
- Les lignes `\restrict` / `\unrestrict` (jetons aléatoires de pg_dump récent) sont retirées du fichier.

## 3. Classification des tables publiques (hors directus_*, lignes en dev)

**Référence (seedées, `02_seed_reference.sql`, 174 INSERT)** : tunnel_role 5, request_status_ref 5, request_type_ref 2, home_view_ref 3, intervention_status_ref 4, purchase_status 5, audit_reason_code 19, audit_rule 26, action_category 6, action_category_meta 5, action_subcategory 35, complexity_factor 13, anomaly_threshold 6, equipement_statuts 6, amelioration_category_ref 4, amelioration_sous_statut_ref 4, action_classification_probe 26.

**Douteuses (à trancher, `03_seed_douteux.sql`, 504 INSERT)** : service 7, equipement_class 73, stock_family 18, stock_sub_family 125, part_template 22, part_template_field 87, part_template_field_enum 162, preventive_rule 10. Ce sont des référentiels génériques en apparence (aucune donnée personnelle) mais calibrés pour l'usine d'origine (plasturgie : extrudeuse, presse à injecter...). part_template* est lié à stock_sub_family par FK (template_id), donc à garder ensemble. `location` (4) n'est PAS exportée : ce sont des noms de sites réels, donc données de l'usine ; la table reste vide.

**Métier (jamais seedées)** : machine 346, machine_hours 48, intervention 319, intervention_action 968, intervention_action_task 143, intervention_action_purchase_request 190, intervention_part 5, intervention_request 181, intervention_status_log 671, request_status_log 433, intervention_task 320, subtask 0, preventive_plan 4, preventive_plan_gamme_step 16, preventive_occurrence 49, preventive_suggestion 32, machine_hours, supplier 23, supplier_order 71, supplier_order_line 327, supplier_order_line_purchase_request 413, purchase_request 416, part 263, part_manufacturer_ref 267, part_supplier_ref 290, manufacturer_item 201, stock_item 253, stock_item_characteristic 135, stock_item_standard_spec 7, stock_item_supplier 280, tunnel_user 8, location 4.

**Technique (jamais seedées)** : audit_log 1213, auth_attempt 249, security_log 319, refresh_token 2687, notification 10, permission_audit_log 6, api_key 1 (contient un hash de clé : jamais), ip_blocklist 0, email_domain_rule 0, schema_migrations 20 (legacy), alembic_version(_backend).

**Vides en dev, laissées vides** : intervention_type 0 (la route admin la lit, mais rien ne la remplit), role_home_view 0 (lien rôle vers vue d'accueil : à décider si on seed un défaut), email_domain_rule 0.

Observation hors périmètre : `intervention_status_ref` a ses colonnes `code` et `label` NULL (seules `id` et `value` sont remplies), alors que `api/intervention_tasks/repo.py:797` filtre `WHERE code = 'ferme'` : cette sous-requête renvoie NULL. À vérifier, probable bug latent. Les seeds reproduisent la dev à l'identique.

### tunnel_endpoint et tunnel_permission

`lifespan` de `api/app.py` : `permission_cache.load()` puis `sync_endpoints_catalog()`. La sync parcourt `app.routes`, fait un UPSERT dans `tunnel_endpoint` (clé `code`, `is_sensitive` = chemin commençant par /admin), puis crée pour chaque rôle de `tunnel_role` la ligne manquante de `tunnel_permission` avec `allowed=false`. Conséquences :

- **tunnel_endpoint : ne pas seeder.** Le catalogue est reconstruit à chaque démarrage (dev : 268 lignes dont des routes disparues ; base neuve : 256).
- **tunnel_permission : ne pas seeder les lignes.** Elles sont créées au démarrage. `tunnel_role` DOIT être seedée avant le premier démarrage, sinon aucune permission n'est créée (la sync ne se relance qu'au démarrage suivant).
- En dev, la matrice a seulement 4 lignes `allowed=true`, toutes pour MCP : `action-categories:list_categories`, `get_category`, `get_category_subcategories`, `dashboard:get_dashboard_summary`. Les autres rôles ont 0 `allowed` (l'accès passe par `require_role`). Si on veut ces 4 droits MCP à l'installation, il faut un script exécuté après le premier démarrage (INSERT ... SELECT par codes de rôle et d'endpoint), ou une logique dans l'app : à décider.

## 4. Seeds

INSERT idempotents (`--inserts --on-conflict-do-nothing`), pas de données personnelles (vérifié par lecture du contenu : libellés, couleurs, codes, mots-clés). Les séquences serial (action_category, action_subcategory, action_classification_probe, anomaly_threshold, audit_reason_code, audit_rule, equipement_statuts, preventive_rule) sont recalées en fin de fichier (`setval` à MAX+1).

## 5. Preuve

Base vierge `tunnel_new` du conteneur jetable : 01, 02, 03 appliqués avec `ON_ERROR_STOP` sans erreur ; 02 et 03 rejoués une seconde fois sans erreur (idempotence).

Diff `pg_dump --schema-only` (mêmes options) dev contre base neuve (`schema.diff`, 22 lignes) :
- les jetons `\restrict` / `\unrestrict` (aléatoires, sans effet) ;
- 3 CHECK et 1 vue (`bool_or` / `bool_and` sur `status IN (...)`) dont l'expression `= ANY (ARRAY[...])` est ré-écrite par PostgreSQL à la ré-analyse (`((ARRAY['a'::varchar])::text[])` contre `ARRAY[('a'::varchar)::text]`). Sémantiquement équivalent, aucun effet.
Aucune autre différence : tables, colonnes, index, contraintes, triggers, fonctions identiques.

API contre la base neuve (port 18000, `API_ENV=test`, `MAIL_ENABLED=false`) : démarrage complet, `GET /health` renvoie 200 `{"status":"ok","version":"4.6.1","database":"connected",...}`. Sync : 256 endpoints, 1280 permissions (256 x 5 rôles, toutes `allowed=false`), 50 sensibles. « PermissionCache chargé : 0 rôles » est normal (rien d'autorisé). Le uvicorn de dev préexistant (port 8000, `--reload`) n'a pas été touché.

## 6. Branchement alembic (proposition, non implémentée)

1. Nouvelle révision unique `0001_baseline` (down_revision = None) qui remplace toute la chaîne 000 à 029 (archivée sous `_legacy`). Son `upgrade()` exécute `01_schema.sql` (installé dans `backend/alembic/sql/`), puis les seeds. `downgrade()` : non supporté (ou DROP des objets) pour la baseline.
2. Les seeds sont séparés du schéma : soit dans la même révision, soit mieux dans un module `seed.py` rejouable à chaque démarrage (ON CONFLICT DO NOTHING), comme le prévoit l'ADR 0002 (alembic upgrade head, puis seeds, puis premier admin).
3. Extensions : `CREATE EXTENSION IF NOT EXISTS` déjà dans le schéma ; le rôle propriétaire doit en avoir le droit (image postgres officielle : POSTGRES_USER est superuser, donc OK).
4. Instance existante : jamais `upgrade`. Procédure : sauvegarde pg_dump complète, puis `alembic stamp 0001_baseline` (avec la table de version choisie ; aujourd'hui `alembic_version_backend`, avec la ligne actuelle remplacée), puis les migrations futures. Les tables `alembic_version` (ancienne) et `schema_migrations` n'ont plus d'utilité. Prévoir un contrôle avant stamp : le schéma réel de l'instance doit égaler `01_schema.sql` (même pg_dump comparé).
5. Garde-fou CI : un test installe une base vierge, applique la chaîne, et compare le pg_dump au schéma de référence.
6. Les migrations suivantes (post-baseline) doivent être normales (upgrade/downgrade).

## NON VÉRIFIÉ

- Aucun test fonctionnel au-delà de /health : pas de connexion, pas de création de données, donc triggers et fonctions non exercés sur la base neuve (schéma identique, comportement non joué).
- Création du premier administrateur (tunnel_user, hash, rôle) : non prototypée. Sans lui, aucune connexion possible.
- Droits d'un rôle applicatif sans superuser (GRANT) : le dump est sans privilèges, le script de rôles reste à écrire.
- Les seeds ne sont pas validés fonctionnellement dans les écrans (listes déroulantes, admin).
- Montée de version PostgreSQL : testé sur postgres:15 seulement (même version que la dev).

## Décisions à demander à l'utilisateur

1. Référentiels douteux (service, equipement_class, stock_family/sub_family, part_template*, preventive_rule) : livrer tels quels, un jeu minimal, ou vides ?
2. `location` : vide, ou un site d'exemple ?
3. Droits MCP (4 lignes) et `role_home_view` : seeder un défaut ?
4. `intervention_status_ref.code` NULL : corriger dans la baseline (renseigner code/label) ou conserver la dev à l'identique ?
5. Table de version : garder `alembic_version_backend` ou repasser à `alembic_version` standard ?
6. Accord pour modifier schéma/alembic (CLAUDE.md section 11.5) au moment d'implémenter.
