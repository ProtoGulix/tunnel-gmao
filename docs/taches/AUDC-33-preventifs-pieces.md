# AUDC-33. Plans préventifs, pièces et leurs références fabricant et fournisseur, références fabricant (manufacturer-items) sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-3
- Dépend de : AUDC-31, AUDC-32
- Périmètre d'écriture : `backend/api/` des domaines preventive_plans, parts, manufacturer_items ; `backend/api/audits/exclusions.py`,
  `backend/api/audits/middleware.py` (`_TABLE_MAP` seulement) ; tests (retrait des xfail
  de la tâche ; signaler avant de changer un test existant) ; docs/api/endpoints des
  domaines ; CHANGELOG. Exclus : autres domaines, part_templates, stock_families, fronts,
  migrations.

## Contexte

Mêmes mécanismes qu'à l'étape 2 (comptes rendus d'AUDC-22 à AUDC-25) : `audit(...)`
(id_from_path, id_from_created + declare_created_id, events_only), `record_audit_event`
pour une entité touchée qui n'est pas celle de la route, aucun rollback() sans raise,
aucun SAVEPOINT. Tout est routinier sauf la suppression (motif explicite, ADR 0018
point 5). Une route dont l'identifiant de chemin n'est pas un uuid de l'entité (ex. code)
dépose un événement avec l'uuid lu en base.

## Critères d'acceptation

- [x] tests AUDC-33 d'AUDC-31 passent sans xfail ; aucune assertion existante affaiblie
- [x] routes du périmètre déclarées, exclusions retirées, inventaire régénéré
- [x] aucun SAVEPOINT ni rollback() avalé dans les repos du périmètre
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

Fait : routes des plans préventifs, pièces (et références fabricant/fournisseur) et
manufacturer-items déclarées ; `_TABLE_MAP` complété ; exclusions retirées (22 `_todo(3)`
restent, hors périmètre) ; inventaire régénéré. Événements : `is_preferred_changed` des
références sœurs, `created` des références créées avec la pièce, `deleted` des références
fournisseur emportées par la suppression d'une référence fabricant, `steps_changed` d'un plan.
`manufacturer_items` : erreurs de base via `raise_db_error` (fuite du message brut corrigée).
Les repos `add_manufacturer_ref` et `add_supplier_ref` retournent maintenant `(id créé, pièce)`.

Écart signalé (test d'AUDC-31, non modifié) : `test_reference_fabricant_supprimee_exige_un_motif`
lit `_data(resp)["id"]` après `POST /parts/{part_id}/manufacturer-refs` et le prend pour l'id de
la référence ; la réponse est la pièce, donc c'est l'id de la pièce (aucune ligne d'audit
`created` pour lui, le test échoue). L'id de la référence est dans `manufacturer_refs`. Correctif
de test attendu : lire la référence dans `manufacturer_refs` (ou changer la réponse de la route,
modification d'API publique non faite). Le comportement est couvert par
`tests/integration/test_audc33_pieces_integration.py` (3 tests, verts).

Contrôle de l'agent principal (2026-11-14) : test d'AUDC-31 corrigé (id de la référence
lu dans manufacturer_refs de la pièce renvoyée ; statut 200 de la suppression, la route
renvoie la pièce : deux suppositions du test, pas d'assertion affaiblie). Au passage,
manufacturer_items passe par raise_db_error au lieu de DatabaseError(str(e)) :
simple alignement, pas une fuite (DatabaseError renvoie toujours le message générique
au client, vérifié le 2026-11-14 ; une première version de ce compte rendu disait le
contraire). check.sh vert ; test-integration.sh 249 passed + fichier corrigé vert.
