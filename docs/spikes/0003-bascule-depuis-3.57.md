# Spike 0003. Répétition de la bascule d'une instance 3.57.0

Date : 2026-11-15. Auteur : agent principal. Statut : répétition complète réussie
(section 4) ; essai final à l'écran par l'utilisateur en attente.

## Contexte

L'instance de production tourne en 3.57.0 (ancienne architecture, base `directus`).
La procédure `deploy/MIGRATION-v4.md` suppose une source à la révision
`030_intervention_status_ref_code`. Répétition sur une copie (dump de la production
restauré dans un conteneur `postgres:15` jetable, sans port publié), jamais sur la
production ni sur la base de dev.

## 1. Révision de la source

`alembic_version_backend` contient deux lignes : `002_create_missing_tables` et
`029_home_view`. La migration 030 n'existe pas dans le dépôt backend archivé
(vérifié par l'utilisateur) : elle n'a été appliquée qu'à la base de dev, d'où
`backend/db/schema.sql` a été tiré (spike 0001). Les codes de
`intervention_status_ref` sont vides dans la source.

## 2. Diff de schéma : source contre `backend/db/schema.sql`

Méthode : base `ref` installée par `schema.sql` dans le même conteneur, puis
comparaison des catalogues (colonnes, contraintes, index, fonctions, déclencheurs,
vues), tables `directus_*` et `alembic_version*` exclues.

### Absent de la source (évolutions faites dans la base de dev seulement)

- Tables `amelioration_category_ref`, `amelioration_sous_statut_ref`,
  `request_type_ref` (et leurs données de départ, dans `seed_reference.sql`).
- Colonnes de `intervention_request` : `type` (NOT NULL, défaut `'standard'`),
  `priorite`, `deadline`, `categorie`, `sous_statut`, `porteur_id`, avec les clés
  étrangères `intervention_request_{type,categorie,sous_statut,porteur_id}_fkey` et
  les index `idx_intervention_request_{type,categorie,sous_statut,porteur_id}`.
- Fonction `fn_set_updated_at()` et déclencheur `trg_tunnel_user_updated_at`.
- Versions récentes de `fn_audit_log_decision` (la source avale encore les erreurs
  par `EXCEPTION WHEN OTHERS`), `fn_sync_status_log_to_intervention` (la source
  compare l'id au lieu du code) et `detect_preventive_suggestions`. Les 8 autres
  fonctions qui diffèrent ne changent que par les blancs et les commentaires.
- `role_home_view.home_view` en varchar(30) dans la source, varchar(50) dans la
  référence (trouvé par le contrôle de BASC-01).
- Nom de la clé primaire de `intervention_task` : `gamme_step_validation_pkey` dans
  la source, `intervention_task_pkey` dans la référence.

### Présent dans la source, absent de la référence (perdu par la base de dev)

| | Source 3.57.0 | Référence (`schema.sql`) | Base de dev (0012) |
| --- | --- | --- | --- |
| Clés étrangères | 92 | 19 | 22 |
| Contraintes CHECK | 18 | 3 | 3 |
| Index | 82 | 20 | NON VÉRIFIÉ |
| Commentaires | ~60 | 11 | NON VÉRIFIÉ |

Parmi elles, les clés de l'arbre des équipements (`machine_equipement_mere_foreign`,
`machine_equipement_class_id_fkey`, `machine_statut_id_fkey`), que l'ADR 0011
croyait absentes : deux portent le nom exact que crée la migration 0003 (section 3). Conséquence hors bascule : une installation neuve n'a presque aucune
clé étrangère (backlog `contraintes-perdues-reference.md`).

## 3. Premier démarrage (après BASC-01)

- La migration 0003 échoue : `machine_equipement_class_id_fkey` et
  `machine_statut_id_fkey` existent déjà dans la source sous le même nom (en NO ACTION),
  et `machine_equipement_mere_foreign` sous un autre nom. Décision de l'utilisateur :
  le rattrapage retire ces 3 clés, 0003 les recrée en ON DELETE RESTRICT (BASC-02).
- Après retrait manuel sur la copie : 0003 à 0012 passent, comptages identiques à la
  source, connexion web et mobile vérifiées à l'écran par l'utilisateur.
- Motifs de clôture TASK_DONE_UNRECORDED, TASK_HANDLED_ELSEWHERE, TASK_DUPLICATE,
  TASK_NO_LONGER_NEEDED absents, LEGACY_STATUS_CHANGE actif : migration 0013 (BASC-03).
- Derrière Cloudflare Access, le bandeau « serveur injoignable » du front web reste
  affiché : le test de santé n'envoie pas les cookies (`credentials: 'omit'`), Access le
  redirige, la CSP bloque la redirection. Hors bascule : branche fix/web-health-cookies.

## 4. Répétition complète (BASC-01 à BASC-03)

Depuis une cible vide, sans retouche manuelle : script `7/7 terminé`, bootstrap de 0003
à 0013 sans erreur, clés de `machine` en ON DELETE RESTRICT, motifs de clôture posés,
LEGACY_STATUS_CHANGE inactif, comptages identiques à la source. Points à reprendre le
jour de la bascule : services autour de l'ancienne base (Grafana, clients MCP,
Directus), service worker de l'ancien front sur les postes, Cloudflare Access si la
production est derrière (SANTE-01 corrige le bandeau).
