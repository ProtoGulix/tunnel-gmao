# AUDC-25. Achats, commandes et équipements sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : ADR 0018 (points 1 bis, 1 quater, 1 quinquies), AUDC-24 (passage après lui :
  un seul agent sur la base d'intégration)
- Périmètre d'écriture : `backend/api/purchase_requests/`, `backend/api/supplier_orders/`,
  `backend/api/equipements/`, `backend/api/transaction.py` (retrait de l'exclusion
  temporaire de /purchase-requests/import seulement), `backend/api/audits/exclusions.py`,
  tests (nouveaux tests ; signaler avant de changer un test existant),
  `docs/api/endpoints/` des trois domaines, CHANGELOG. Exclus : socle d'audit, autres
  domaines, fronts, migrations.

## Contexte

Décisions de l'utilisateur (ADR 0018, 1 quinquies) : import CSV et répartition des
demandes d'achat valident toutes les lignes avant d'écrire ; import tout ou rien avec le
rapport d'erreurs ; répartition des seules demandes répartissables, les autres signalées
sans écriture. `dispatch_all` (purchase_requests/repo.py:1556) isole chaque demande par
SAVEPOINT (1596-1697) : interdit (ADR 0018, 1 quater). Un `conn.rollback()` suivi d'un
`raise` reste admis (la requête échoue de toute façon) ; un rollback sans raise ne l'est
pas. POST /purchase-requests/import/headers et POST /supplier-orders/{id}/export/email
n'écrivent rien : exclus « sans écriture » (accord de l'utilisateur, 2026-11-14), à
vérifier dans le code avant de les exclure.

## Critères d'acceptation

- [x] tests qui échouent d'abord, puis passent :
  - import CSV avec une ligne invalide : rien écrit, rapport d'erreurs complet (toutes
    les lignes, pas seulement la première) ; import valide : chaque demande créée a sa
    ligne `created`, auteur = jeton
  - répartition : demandes non répartissables signalées sans écriture, les autres
    réparties ; erreur SQL : 500, rien réparti
  - création, modification, suppression (motif explicite exigé) des demandes d'achat,
    commandes fournisseurs et équipements tracées par le middleware, sans doublon
- [x] plus aucun SAVEPOINT ni rollback sans raise dans les trois domaines
- [x] routes déclarées ou exclues « sans écriture » (raison écrite dans exclusions.py),
      exclusion temporaire retirée de api/transaction.py, inventaire régénéré ; plus
      aucune route « à traiter étape 2 » hors AUDC-24
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

backend-dev (2026-11-14) : tests d'abord (backend/tests/integration/
test_audc25_achats_integration.py, 8 tests ; backend/tests/test_achats_sans_rollback.py, 6
tests), vus en échec pour la bonne raison avant le code (import 201 avec succès partiel,
dispatch 200 avec SAVEPOINT, aucune ligne `created`).

- Import CSV : phase 1 en lecture seule (validation + analyse de toutes les lignes, quantité
  bornée à l'entier SQL), phase 2 (création) seulement sans erreur et hors dry_run. Une ligne
  invalide : 422 avec le rapport complet (`ImportRejected`), rien écrit. Plus de `except
  Exception` par ligne. Chaque DA créée dépose un événement `created` (motif de la requête).
- Répartition : phase 1 lecture seule (`_supplier_rows_for_dispatch`), phase 2 écriture des
  seules demandes répartissables ; les autres dans `errors[]`. SAVEPOINT supprimés. Événements :
  `created` des commandes (système, SYSTEM_CASCADE) et `dispatched` de chaque demande.
- Routes déclarées : POST/PUT/DELETE des demandes d'achat, commandes fournisseurs et
  équipements (+ PATCH équipement) ; `dispatch` et `import` en `events_only`. Plus aucun
  SAVEPOINT ; les `rollback()` restants des trois repos sont tous suivis d'un `raise`
  (test statique). `_TEMPORARY_EXCLUSIONS` vide ; test_transaction_exclusions.py mis à jour
  (assertion de la liste figée : c'est l'objet de la tâche).
- Exclusions « sans écriture » (vérifié dans le code) : `import/headers` (lit l'upload, aucun
  appel au repo ni à la base) ; `export/email` (`get_export_data` : uniquement des SELECT).
  Raison écrite dans exclusions.py (catégorie NO_WRITE). Inventaire régénéré (125 routes), plus
  aucune route « à traiter étape 2 ».
- Docs : docs/api/endpoints (purchase-requests, supplier-orders, equipements), CHANGELOG.

Tests : check.sh vert (218 passed). Intégration : la base d'intégration ne démarre pas dans
l'arbre courant (migration 0008 d'AUDC-29, travail d'un autre agent : IntegrityError
audit_rule_pkey, INSERT ... MAX(id)+1 ... WHERE NOT EXISTS renvoie id 1 si la règle existe
déjà). Suite complète lancée sur une copie de l'arbre sans 0008 ni les fichiers d'AUDC-29 :
208 passed, 4 failed (voir ci-dessous) ; mes 8 tests passent.

Tests existants en contradiction avec la décision (NON modifiés, à arbitrer) :
1. tests/integration/test_audc_garde_fous_integration.py::
   test_import_csv_avec_ligne_fautive_garde_le_succes_partiel : décrit le succès partiel
   (2 créées, 1 erreur, 201). Modification proposée : attendre 422, created == 0, errors == 1,
   statuts {1: "preview", 2: "error", 3: "preview"} et 0 demande créée pour les trois libellés.
2. tests/integration/test_equipements_integration.py::test_arbre_suppression_refusee_avec_des_filles
   (ligne 90) : supprime une feuille sans motif ; une suppression exige désormais un motif
   explicite (400 sinon). Modification proposée : `client.request("DELETE", ..., json=
   {"reason_code": "EQUIPMENT_UPDATE"})`.
Deux autres échecs, hors périmètre (test_audc22_interventions_demandes_integration : 2 lignes
`status_transitioned` au lieu d'une), viennent du travail non commité d'AUDC-22c dans
interventions/repo.py.

Questions ouvertes : (a) 422 pour un import rejeté : le front (hors périmètre) n'a pas été
vérifié, il peut traiter un 4xx en erreur sans afficher le rapport ; (b) aucun motif
proposable à l'utilisateur pour supprimer un équipement (seul EQUIPMENT_UPDATE, catégorie auto,
est applicable à l'entité) : motif à ajouter aux données de référence (migration, non faite) ;
(c) `DELETE` des commandes et demandes répondent 200 avec message (la doc indiquait 204,
corrigée).

Contrôle de l'agent principal (2026-11-14) : deux tests existants changés selon la
décision de l'utilisateur et la proposition de l'agent : import CSV avec ligne fautive
→ 422, rien écrit (tout ou rien) ; suppression d'équipement avec motif explicite (le 400
du parent vérifie maintenant le message « sous-équipement »). Motif provisoire
EQUIPMENT_UPDATE (catégorie auto) : aucun motif de suppression d'équipement proposable,
question à l'utilisateur. check.sh vert (218 passed) ; test-integration.sh 214 passed.
