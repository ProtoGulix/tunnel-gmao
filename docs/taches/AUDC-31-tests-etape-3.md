# AUDC-31. Tests qui échouent de l'étape 3

- Statut : faite (2026-11-14)
- Agent : test-writer
- Branche : refactor/audit-etape-3
- Dépend de : ADR 0018 ; décisions de l'utilisateur du 2026-11-14 (AUDC-plan, décision 8)
- Périmètre d'écriture : `backend/tests/` seulement. Exclus : code de production, docs.

## Contexte

Étape 3 : routes « à traiter étape 3 » de docs/taches/AUDC-routes.md, sauf part-templates
(exclues : fonctionnalité abandonnée) et stock-families (identifiant texte, en attente
de décision). Entités : preventive_plan, part, part_manufacturer_ref, part_supplier_ref, manufacturer_item, stock_item, stock_sub_family, stock_item_supplier, supplier, supplier_order_line. Décision : tout est routinier sauf la suppression (motif
explicite). Tests modèles : tests/integration/test_audc25_achats_integration.py,
tests/test_audit_etape2.py, tests/test_achats_sans_rollback.py.

## Critères d'acceptation

- [x] test unitaire (xfail strict « AUDC-33 » ou « AUDC-34 » selon le domaine) : chaque
      route de l'étape 3 hors part-templates et stock-families est déclarée
- [x] test statique : aucun SAVEPOINT ni rollback() non suivi d'un raise dans les repos
      des domaines (xfail si c'est le cas aujourd'hui, sinon garde-fou vert)
- [x] intégration, pour un échantillon par domaine (au moins plan préventif, pièce,
      article de stock, fournisseur, ligne de commande) : création → ligne `created`
      au nom du jeton ; modification → lignes `*_changed` sans motif envoyé ;
      suppression sans motif → 400 et rien supprimé ; suppression avec
      DELETE_CREATED_BY_MISTAKE → `deleted` avec l'état avant
- [x] les tests d'intégration supposent la migration 0010 (AUDC-32, en parallèle) :
      xfail tant qu'elle manque ; check.sh vert, test-integration.sh vert (xfail compris)

## Compte rendu final

test-writer (2026-11-14) : test_audit_etape3.py (37 routes en xfail AUDC-33/34, 18
garde-fous statiques déjà verts : aucun rollback avalé ni SAVEPOINT dans les 9 repos),
test_audc31_etape3_integration.py (6 échantillons en xfail, échec pour la bonne raison :
aucune ligne created). Constats : DELETE /preventive-plans/{id} est une désactivation
(active=false) ; pas de DELETE de pièce. Agent principal : check.sh vert ;
test-integration.sh 244 passed, 6 xfailed.
