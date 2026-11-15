# BASC-01. Bascule depuis une source 3.57.0 (révision 029)

- Statut : faite (2026-11-15)
- Agent : db-dev
- Branche : fix/bascule-depuis-3.57 (depuis develop, ADR 0008)
- Dépend de : spike 0003 (docs/spikes/0003-bascule-depuis-3.57.md), ADR 0002, 0006
- Périmètre d'écriture : `deploy/migrate-from-v4.sh`, `deploy/MIGRATION-v4.md`,
  nouveau fichier `deploy/rattrapage-029.sql`, `CHANGELOG.md` (section « Non publié »).
  Exclus : `backend/` (schema.sql, seed, migrations), `deploy/docker-compose*.yml`,
  toute écriture dans la base de dev (projet Compose `tunnel`).

## Contexte

La production est en 3.57.0 : source à `029_home_view` (plus une ligne héritée
`002_create_missing_tables`), sans la migration 030 ni d'autres évolutions faites dans
la seule base de dev, mais avec bien plus de contraintes que la référence (spike 0003).
Le script refuse aujourd'hui cette source deux fois (révision, diff de schéma).
Décision de l'utilisateur du 2026-11-15 : rattraper sur la base cible, ne jamais
modifier la source, ne supprimer aucune contrainte de la production.

## Critères d'acceptation

- [x] Le script accepte la source si ses révisions sont exactement
      `030_intervention_status_ref_code`, ou exactement l'ensemble
      {`002_create_missing_tables`, `029_home_view`} (ordre indifférent) ; refuse tout
      le reste.
- [x] Source à 029 : après la restauration et avant toute vérification,
      `deploy/rattrapage-029.sql` est appliqué à la cible en une transaction par
      `tunnel_owner`, en `ON_ERROR_STOP`. Il ajoute tout ce que la section 2 du spike
      liste comme absent de la source (tables et leurs données de départ reprises de
      `backend/db/seed_reference.sql`, colonnes, clés, index, fonctions et déclencheur
      repris à l'identique de `backend/db/schema.sql`, renommage de la clé primaire,
      `intervention_status_ref.code = id`). Il ne supprime aucune contrainte, aucun
      index, aucune donnée.
- [x] Le contrôle de schéma devient « la cible contient au moins la référence » :
      chaque colonne (type, nullabilité, défaut, identité), contrainte (nom et
      définition), index, fonction (définition), déclencheur et vue de la base neuve
      existe à l'identique dans la cible. Ce qui est en plus dans la cible est listé
      (nombre par catégorie) sans bloquer. Tout manque ou écart bloque le stamp et
      est affiché. Le contrôle reste valable pour une source à 030.
- [x] Les comparaisons de données (nombres de lignes, empreinte de `tunnel_user`)
      restent faites contre la source, en tenant compte des 3 tables créées par le
      rattrapage (absentes de la source).
- [x] Essai réel sur la copie de production : conteneur `rep-bascule-source` (déjà
      lancé, base `directus` restaurée, base `ref` à supprimer ou ignorer), cible dans
      un projet Compose séparé `-p tunnel-repetition`, `HTTP_PORT=8090`, `.env` hors
      git. Le script va jusqu'à `7/7 terminé`. L'agent ne lance PAS l'api : le
      démarrage est fait par l'agent principal.
- [x] `MIGRATION-v4.md` : prérequis (030 ou 029), étape 6 corrigée (le bootstrap
      applique les migrations jusqu'à la tête, 0012 en 5.3.0, et non « rien à faire »),
      avertissement sur les services qui dépendent de l'ancienne base ou de l'ancienne
      API (Grafana, clients MCP).
- [x] `bash -n` propre sur le script (shellcheck non installé : NON VÉRIFIÉ) ;
      scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (db-dev, worktree) : source acceptée à 030 ou {002, 029} ; `deploy/rattrapage-029.sql`
appliqué à la cible en une transaction (tables de référence et seed, colonnes, clés,
index, 12 fonctions reprises de schema.sql dont 8 qui ne différaient que par les blancs,
équivalence vérifiée, déclencheur, renommage de clé primaire, codes de statut,
élargissement de `role_home_view.home_view` en varchar(50), écart trouvé par le contrôle) ;
contrôle de schéma par catalogue « au moins la référence » (866 objets ; en plus dans la
cible : 92 contraintes, 66 index) ; comparaison des lignes hors tables du rattrapage.
Fichiers : deploy/migrate-from-v4.sh, deploy/rattrapage-029.sql, deploy/MIGRATION-v4.md,
CHANGELOG.md. Essai sur la copie de production : `7/7 terminé`.

Commandes en échec (agent) : requête de catalogue (`operator is not unique: text ||
"char"`, corrigée par cast) ; contrôle refusé à bon droit (8 fonctions, role_home_view),
corrigé dans le rattrapage. check.sh rouge dans le worktree faute de web/node_modules.

Contrôle de l'agent principal : diff --stat conforme au périmètre ; aucun DROP de
contrainte, d'index ou de données ; check.sh vert sur la branche ; bash -n propre.
Démarrage par l'agent principal : la migration 0003 échoue (`machine_equipement_class_id_fkey
already exists`), la production ayant déjà ces clés sous le même nom : traité par BASC-02.
Après retrait manuel de ces clés sur la copie, 0003 à 0012 passent, comptages identiques
(10 comptes, 411 interventions, 1604 actions), connexion web et mobile vérifiées par
l'utilisateur. NON VÉRIFIÉ : chemin source 030, contrôle en négatif, shellcheck.
