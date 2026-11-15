# AUDC-35. Fronts de l'étape 3

- Statut : faite (2026-11-14), essai à l'écran à faire
- Agent : frontend-dev
- Branche : refactor/audit-etape-3
- Dépend de : AUDC-33, AUDC-34
- Périmètre d'écriture : `web/src/`, `mobile/src/` si concerné, tests front, CHANGELOG.

## Critères d'acceptation

- [x] `web/src/lib/api/auditEntity.js` : préfixes d'URL des routes de l'étape 3 vers
      leur entité (le 400 de motif ouvre la fenêtre de motif filtrée sur `deleted`)
- [x] chaque suppression de ces écrans aboutit après le choix du motif ; fermer la
      fenêtre n'affiche pas d'erreur ; aucun motif codé en dur
- [x] eslint sans nom non défini sur les fichiers touchés (règles no-undef,
      react/jsx-no-undef : le build ne les voit pas)
- [x] gestes d'essai à l'écran listés dans le compte rendu ; check.sh vert ; CHANGELOG

## Compte rendu final

Web : `auditEntity.js` complété (preventive-plans, parts, manufacturer-items, stock-items,
stock-families, stock-sub-families, stock-item-suppliers, suppliers, supplier-order-lines ;
sous-ressources parts/manufacturer-refs et parts/supplier-refs vers leurs entités propres),
test ajouté dans auditGuard.test.js. Fermeture de la fenêtre sans erreur (`isAuditCancelled`)
ajoutée aux suppressions : plan préventif (PreventivePage, PreventivePlansTab), pièce (PartsTab),
article (StockItemsTab), fabricant (ManufacturersTab), référence fabricant (MfrRefRow),
référence fournisseur (PartSupplierRefsPanel), lien article-fournisseur (StockItemSuppliers).
Le DELETE passe par auditGuard (400 puis fenêtre filtrée `deleted`), aucun motif codé en dur.

Écrans sans suppression : fournisseurs (`deleteSupplier` et `deleteSupplierOrderLine` sans
appelant), familles et sous-familles (pas de DELETE), lien demande d'achat vers ligne (aucun
appel web ni mobile). Mobile : seule suppression, tâche (étape 2) ; rien de l'étape 3.

NON VÉRIFIÉ : rien essayé à l'écran ; que les motifs `deleted` s'appliquent aux entités de
l'étape 3 en base (entity_types).

Contrôle de l'agent principal (2026-11-14) : diff relu ; le bouton de suppression de pièce
appelle une route qui n'existe pas (405, antérieur à l'étape 3) : backlog
suites-audc-etape-2.md point 10. check.sh vert.

Relecture de la branche (2026-11-14, APPROUVÉ AVEC RÉSERVES) : entité d'audit des
créations de références (POST .../manufacturer-refs, .../supplier-refs) corrigée côté
web avec test ; faux événement true → false sur une référence déjà préférée corrigé côté
backend (exclude_id, test qui échouait avant) ; autres réserves au backlog
(suites-audc-etape-2.md, points 13 à 15). check.sh vert ; test-integration.sh 261 passed.
