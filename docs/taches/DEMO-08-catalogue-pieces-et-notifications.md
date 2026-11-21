# DEMO-08. Démo : catalogue des pièces, notifications au chargement ; cahier corrigé

- Statut : faite (2026-11-21)
- Agent : db-dev (chargeur et réinitialisation), principal (cahier)
- Branche : fix/demo-catalogue-pieces (depuis develop)
- Dépend de : DEMO-06, DEMO-07 (constats des parcours)
- Périmètre d'écriture : deploy/demo/load_demo.py, deploy/demo/reset-demo.sh, deploy/demo/README.md, backend/tests/integration/test_demo_loader_integration.py, CHANGELOG.md, docs/cahier-fonctionnel.md, docs/cahier-fonctionnel-site.md, cette fiche, docs/ETAT.md ; scénario inchangé

## Contexte

Parcours DEMO-07 (2026-11-21) : l'écran Stock du web lit les pièces (`part`,
`part_manufacturer_ref`, `part_supplier_ref`, route /parts) et reste vide sur la démo, car
le chargeur remplit l'ancien modèle `stock_item`. Vérifié par l'agent principal en lecture
seule sur la base de dev : 437 pièces, 508 références fournisseur, 497 demandes d'achat
liées par `part_id`, aucune par `stock_item_id`. Le cahier fonctionnel (section 1.6) cite
donc les mauvaises tables. Autre constat : aucune notification sur la démo, car la tâche
quotidienne de l'API passe au démarrage, avant le chargement du scénario.

## Critères d'acceptation

- [x] le chargeur crée les articles du scénario comme pièces (`part`, une référence fabricant par pièce, références fournisseur rattachées), et les demandes d'achat et lignes de commande pointent vers `part_id`, comme en production ; l'écran Stock affiche les 65 pièces
- [x] reset-demo.sh redémarre l'API après le chargement : le premier passage de la tâche quotidienne voit le scénario (notifications de retard, occurrences dues)
- [x] test d'intégration du chargeur mis à jour (pièces, liens part_id) ; test-integration.sh vert
- [x] cahier 1.6 et résumé du site corrigés (tables `part`, preuve, `stock_item` ancien modèle)
- [x] CHANGELOG « Non publié » à jour ; démo rechargée et écran Stock contrôlé par capture

## Compte rendu final

Partie chargeur (db-dev, branche fix/demo-catalogue-pieces-loader) :

- `load_demo.py` : 65 articles chargés en `part` (+ une `part_manufacturer_ref` préférée par
  pièce, libellé = désignation, référence = `ref` de l'article ; tous les articles ont un
  fabricant, repli « Fabricant générique » prévu), 146 `part_supplier_ref` rattachées. Demandes
  d'achat et lignes de commande par `part_id` ; lignes avec `manufacturer`/`manufacturer_ref`.
  Plus aucune écriture dans `stock_item`, `stock_item_supplier`, `manufacturer_item` (aucun
  écran livré n'en a besoin pour la démo). `spec` et `dimension` des articles ne sont plus
  chargés : `part` n'a pas ces colonnes.
- `reset-demo.sh` : `restart api` puis attente de santé avant la publication du web.
- Test d'intégration mis à jour.
- Essai sur projet jetable tunnel-demo-t08 (supprimé) : 65 pièces, 75 notifications dont 28
  preventif_echeance, GET /parts (65, libellés lisibles), /purchase-requests/list (52 : 44
  reçues, 3 à dispatcher, 3 en chiffrage, 2 mutualisation), /dispatch/preview, /supplier-orders
  (34) : 200, aucune erreur 500.

Agent principal : cahier 1.6 et ligne 18 du résumé corrigés (tables `part`, vérifiées au
tag v5.0.0) ; seed `request.status_to` routinière (accord de l'utilisateur), test
d'intégration qui échoue sans le correctif ; le test AUDC-26 qui supposait la règle non
routinière la pose désormais lui-même le temps de son exécution (intention conservée : pas
de repli silencieux sur un motif codé en dur). Commande en échec, corrigée : première suite
d'intégration complète, 1 failed (ce test AUDC-26), puis 596 passed. Reviewer APPROUVÉ
(réserves de documentation traitées). Démo réelle rechargée depuis la branche : 65 pièces
sur l'écran Stock (capture relue), 75 notifications, données de test des parcours effacées.
Reste cosmétique : badge « Nouveau » à côté de la version malgré la version vue renseignée
(NON VÉRIFIÉ : cause).
