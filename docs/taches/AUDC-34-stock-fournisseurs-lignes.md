# AUDC-34. Articles de stock, sous-familles, fournisseurs d'articles, fournisseurs, lignes de commande fournisseur sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-3
- Dépend de : AUDC-31, AUDC-32
- Périmètre d'écriture : `backend/api/` des domaines stock_items, stock_sub_families, stock_item_suppliers, suppliers, supplier_order_lines ; `backend/api/audits/exclusions.py`,
  `backend/api/audits/middleware.py` (`_TABLE_MAP` seulement) ; tests (retrait des xfail
  de la tâche ; signaler avant de changer un test existant) ; docs/api/endpoints des
  domaines ; CHANGELOG. `backend/api/stock_families/` (familles, décision ci-dessous) ; migration
  `0011_audit_famille_stock.py` (règle routinière de stock_family, modèle 0010) et sa
  ligne de seed. Exclus : autres domaines, part_templates, fronts.

## Contexte

Mêmes mécanismes qu'à l'étape 2 (comptes rendus d'AUDC-22 à AUDC-25) : `audit(...)`
(id_from_path, id_from_created + declare_created_id, events_only), `record_audit_event`
pour une entité touchée qui n'est pas celle de la route, aucun rollback() sans raise,
aucun SAVEPOINT. Tout est routinier sauf la suppression (motif explicite, ADR 0018
point 5). Une route dont l'identifiant de chemin n'est pas un uuid de l'entité (ex. code)
dépose un événement avec l'uuid lu en base.

Familles de stock (décision de l'utilisateur, 2026-11-14) : `stock_family` n'a qu'un
code texte comme clé, alors que audit_log.entity_id est un uuid. L'entité est tracée sous
un uuid déterministe calculé depuis le code (uuid5, espace de noms constant documenté,
fonction unique dans api/audits/), le code étant aussi écrit dans old_value/new_value.
Pas de changement de schéma.

## Critères d'acceptation

- [x] tests AUDC-34 d'AUDC-31 passent sans xfail ; aucune assertion existante affaiblie
- [x] routes du périmètre déclarées, exclusions retirées, inventaire régénéré
- [x] aucun SAVEPOINT ni rollback() avalé dans les repos du périmètre
- [x] POST /stock-families et PATCH /stock-families/{family_code} : ligne d'audit sous
      l'uuid déterministe du code (test : même code → même entity_id, code présent
      dans la valeur) ; migration 0011 (stock_family routinière) idempotente, bootstrap
      à 0011
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

Fait : routes des articles, sous-familles, liens article-fournisseur, fournisseurs, lignes de
commande et familles déclarées ; `_TABLE_MAP` complété ; 22 exclusions `_todo(3)` retirées ;
inventaire régénéré (plus de route « à traiter étape 3 »). Familles : `api/audits/entity_ids.py`
(`stock_family_entity_id`, uuid5, espace de noms constant), migration 0011 idempotente, seed,
bootstrap à 0011. Événements : `created` / `code_changed` / `label_changed` (familles, sous l'uuid
de l'ancien code, code dans les valeurs), `created` / `label_changed` / `template_id_changed`
(sous-familles, uuid lu en base, `events_only`), `is_preferred_changed` des liens sœurs,
`is_selected_changed` des lignes désélectionnées, `purchase_requests_changed` (création, PUT/PATCH,
lien, retrait). Le retrait d'un lien de demande d'achat (DELETE) est `events_only` : une route
déclarée aurait écrit un faux `deleted` sur la ligne ; le motif explicite reste exigé (DELETE).
Aucune assertion existante modifiée (marqueurs xfail retirés ; `_params` de test_audit_etape3
simplifié). Tests : test_audit_entity_ids.py, integration/test_audc34_stock_integration.py (7).
Aucune erreur de code HTTP ou de forme dans les tests d'AUDC-31.

Contrôle de l'agent principal (2026-11-14) : diff conforme ; seule assertion changée :
révision de bootstrap (0011). Choix acceptés : DELETE d'un lien demande-ligne en
events_only (pas de faux `deleted` sur la ligne) ; renommage de famille tracé sous
l'uuid de l'ancien code. Le « texte brut » signalé dans plusieurs repos n'atteint pas le
client (DatabaseError renvoie le message générique). check.sh vert ; test-integration.sh
260 passed. Migration 0011 jouée sur la base de dev le 2026-11-14 (accord explicite de l'utilisateur).
