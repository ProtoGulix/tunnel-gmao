# SUIT-01. Backend : suites de l'audit centralisé avant la version

- Statut : terminée (2026-11-15)
- Agent : backend-dev
- Branche : fix/suites-audc-avant-version
- Dépend de : décisions de l'utilisateur du 2026-11-15 (ci-dessous)
- Périmètre d'écriture : `backend/api/`, `backend/tests/`, `docs/endpoints/`,
  `docs/backlog/suites-audc-etape-2.md`, `docs/backlog/routes-referentiel-cassees.md`,
  CHANGELOG.md. Exclus : `backend/alembic/` (aucune migration), fronts.

## Contexte

Backlog de la session du 2026-11-14 (docs/backlog/suites-audc-etape-2.md points 17 et 18,
docs/backlog/routes-referentiel-cassees.md). Décisions de l'utilisateur du 2026-11-15 :
retirer les quatre routes cassées ; refuser une règle de domaine de courriel qui
exclurait l'administrateur qui la pose ; retirer du catalogue, au démarrage, les
endpoints disparus du code et leurs lignes de droits. En plus : la liste des IP bloquées
renvoie le nom de l'auteur (la colonne « Créé par » affiche un uuid).

## Critères d'acceptation

- [x] Routes retirées : PATCH /admin/action-categories/{category_id}/active,
      PATCH /admin/action-subcategories/{subcat_id}/active, PATCH
      /admin/complexity-factors/{factor_id}, PATCH /admin/complexity-factors/{factor_id}/active
      (routes, repo, schémas morts, entrées de api/audits/exclusions.py, permissions par
      défaut s'il y en a, docs/endpoints) ; test que ces routes n'existent plus (404/405)
- [x] Règle de domaine : création, modification ou suppression refusée (409, message clair
      en français, aucune écriture) si, après le changement, le compte qui la fait ne
      pourrait plus se connecter selon la logique de api/auth/routes.py ; tests
      d'intégration (refus, acceptation quand le domaine de l'admin reste couvert)
- [x] Synchronisation du catalogue (api/endpoints_catalog.py) : les endpoints absents du
      code sont supprimés avec leurs lignes tunnel_permission, nombre retiré dans les
      logs ; test d'intégration ; une écriture en base au démarrage (accord de
      l'utilisateur du 2026-11-15 pour la base de dev)
- [x] GET de la liste des IP bloquées : champ `created_by_name` (prénom nom ou courriel
      de l'auteur, null si inconnu), ajout sans casser le champ `created_by` ; test
- [x] Points 17 et 18 et fichier routes-referentiel-cassees.md marqués traités dans le backlog
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : quatre routes retirées (routes, schémas, exclusions, docs/api/endpoints/admin.md) ;
règle de domaine : `_assert_actor_can_still_login` dans api/admin/repo.py (ajout/upsert et
suppression, 409 puis rollback ; pas de route de modification distincte, l'upsert la couvre) ;
`purge_removed_endpoints` dans api/endpoints_catalog.py (aucune clé étrangère en base : suppression
explicite des droits ; permission_audit_log conservé) ; `created_by_name` sur GET /admin/ip-blocklist.

Tests : tests/integration/test_suit01_integration.py (nouveau), test_audit_etape4.py (routes retirées),
compteurs de permissions ajustés (ADMIN 256 -> 252, RESP 220 -> 216, les quatre routes étaient
accordées à RESP et ADMIN), test_audc41 : fixture ajoutant le domaine de l'admin, requise désormais
pour poser une règle. check.sh vert ; test-integration.sh : 329 passés.
Échecs passagers corrigés : ConflictError masquée en 500 par raise_db_error (relevée), compteurs.

Contrôle de l'agent principal (2026-11-15) : purge ignorée si aucune route n'est fournie
(garde et test ajoutés, sinon une application mal chargée effacerait toute la matrice des
droits) ; contrôle des règles de domaine fermé par défaut (auteur inconnu : refus) ;
check.sh vert, test-integration.sh 330 passés ; reviewer APPROUVÉ AVEC RÉSERVES, réserves
corrigées. Base de dev : purge jouée au rechargement de l'API (accord du 2026-11-15),
252 endpoints, POST /audit/log retirée.
