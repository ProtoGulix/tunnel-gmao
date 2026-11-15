# AUDC-44. Référentiels d'administration sous l'audit centralisé

- Statut : faite, sauf un test (voir compte rendu)
- Agent : backend-dev
- Branche : refactor/audit-etape-4
- Dépend de : AUDC-41, AUDC-42, AUDC-43
- Périmètre d'écriture : `backend/api/admin/` (routes et nouveau repo des référentiels),
  `backend/api/audits/` (repo des motifs et règles, exclusions) ; tests (retrait des xfail
  de la tâche) ; docs/api/endpoints concernés ; CHANGELOG. Exclus : routes utilisateurs,
  droits, endpoints, sécurité (AUDC-45), fronts.

## Contexte

Routes : PATCH /admin/action-categories/{id}, POST et PATCH /admin/action-subcategories,
POST et PATCH(+active) /admin/intervention-types, PATCH /admin/intervention-statuses/{code},
POST et PATCH(+active) /admin/audit-reasons, POST et PATCH /admin/audit-rules. Le SQL est
aujourd'hui écrit dans admin/routes.py : il passe dans un repo (conventions backend), sans
changer le comportement ni les réponses. Clés int ou texte : identifiants uuid5 d'AUDC-43
(événement déposé par le repo, clé d'origine dans les valeurs). Routinier, pas de DELETE
dans ce périmètre. Les 4 routes cassées restent exclues, intactes.

## Critères d'acceptation

- [ ] plus de SQL dans admin/routes.py pour ces routes ; réponses inchangées (tests
      existants verts sans modification)
- [ ] chaque route écrit sa ligne routinière sous l'uuid5 de l'entité ; exclusions
      retirées ; inventaire régénéré (`cd backend && .venv/bin/python -m scripts.audit_routes`)
- [ ] aucun rollback() avalé, aucun SAVEPOINT
- [ ] tests AUDC-44 verts sans xfail ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : `api/admin/referentiel_repo.py` (ReferentielRepository : listes et écritures des
catégories et sous-catégories d'action, types et statuts d'intervention ; colonnes en liste
blanche ; erreurs par `raise_db_error`, aucun rollback ni SAVEPOINT). Routes déclarées
`audit(..., events_only=True)` ; événements `created` et `{champ}_changed` déposés par le repo
sous `entity_id_for`, états complets (clé d'origine comprise) dans old/new_value. Motifs et
règles d'audit : `api/audits/repo.py` (états avant lus dans la même requête). Nouveau
`record_field_changes` dans `api/audits/events.py` (test : `tests/test_audit_field_changes.py`).
12 exclusions `_todo(4)` retirées, inventaire régénéré, docs/api/endpoints/admin.md, CHANGELOG.
Les 4 routes cassées et la liste des facteurs de complexité restent intactes dans routes.py.
Comportements conservés : PATCH d'une clé inconnue = succès sans trace ; « Rien à mettre à jour »
= 400. Seul écart : une erreur de base passe par `raise_db_error` (409 sur doublon, 400 sur
clé étrangère) au lieu de remonter brute.
Tests existants changés : aucun ; xfail AUDC-44 retirés (test_audit_etape4.py,
test_audc41_etape4_integration.py).
Résultats : check.sh vert (315 passés, 25 xfail AUDC-45) ; test-integration.sh 300 passés,
17 xfail AUDC-45, 1 échec : `test_statut_d_intervention_modifie_sous_l_uuid5_de_son_code`.
Ce test est faux : `intervention_status_ref.label` vaut NULL dans les données de départ
(`db/seed_reference.sql`), donc `ancien` est None et la restauration `{"label": None}` reçoit
400 « Rien à mettre à jour » (comportement existant). Non modifié ; correction proposée :
restaurer la valeur par SQL, ou partir d'un libellé non nul.

Contrôle de l'agent principal (2026-11-14) : test du statut d'intervention corrigé (le
libellé de `attente_pieces` est NULL dans le seed : deux libellés non vides, puis
restauration en SQL dans un finally). Écart accepté : une erreur de base passe par
raise_db_error (409/400, message générique) au lieu de remonter brute. check.sh vert ;
test-integration.sh 301 passés, 17 xfail (AUDC-45).
