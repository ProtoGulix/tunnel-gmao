# SUIT-02. Web : suites de l'audit centralisé avant la version

- Statut : terminé, à relire à l'écran (2026-11-15)
- Agent : frontend-dev
- Branche : fix/suites-audc-avant-version
- Dépend de : SUIT-01 pour `created_by_name` et le retrait des routes
- Périmètre d'écriture : `web/src/`, `docs/backlog/suites-audc-etape-2.md` (points 10 à
  13, 15, 16), CHANGELOG.md. Exclus : backend, mobile.

## Contexte

Backlog de la session du 2026-11-14 (docs/backlog/suites-audc-etape-2.md points 10 à 16,
docs/backlog/routes-referentiel-cassees.md). Décisions de l'utilisateur du 2026-11-15 :
retirer le bouton Supprimer de l'onglet Pièces (aucune route backend) ; retirer les
boutons des quatre routes de référentiel cassées, retirées par SUIT-01.

## Critères d'acceptation

- [x] Onglet Pièces : bouton Supprimer et appel DELETE /parts/{id} retirés (point 10)
- [x] Référentiel : boutons et fonctions d'API d'activation des catégories et
      sous-catégories d'action, de modification et d'activation des facteurs de
      complexité retirés (web/src/api/adminReferentiel.js et écrans)
- [x] Fonctions et hooks sans appelant retirés : deleteSupplier, deleteSupplierOrderLine,
      suppression du lien demande d'achat ↔ ligne de commande, removeLink et
      removeSupplier de useSupplierDetail, doublon de equipementClasses.js (points 11, 13)
- [x] Désactivation d'un plan : la confirmation se ferme quand la fenêtre de motif
      s'ouvre (point 12, constat à vérifier dans le code)
- [x] Pages Préventif et administration des plans : un échec de désactivation, de
      réactivation ou d'enregistrement des étapes affiche un message (point 16)
- [x] IP bloquées : colonne « Créé par » affiche `created_by_name` (repli « — »)
- [x] Règles de domaine : texte d'écran qui explique qu'une règle restreint la connexion
      de tous les comptes aux domaines autorisés ; le refus 409 du backend est affiché
- [x] Lint des fichiers touchés : aucune erreur nouvelle ; corriger celles du point 15
      quand c'est simple (max-lines, complexité, variable inutilisée)
- [x] scripts/check.sh vert ; tests front (vitest) verts
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : bouton Supprimer et deletePart retirés ; quatre fonctions d'API de référentiel et
leurs boutons retirés (facteurs en lecture seule) ; deleteSupplier, deleteSupplierOrderLine,
removeSupplier, removeLink et les fonctions de equipementClasses.js doublonnées retirés (le
« lien demande d'achat ↔ ligne de commande » n'existe pas dans le web : seul
deleteSupplierItemLink était concerné, il reste utilisé par StockItemSuppliers) ;
confirmation de désactivation fermée avant la fenêtre de motif (nouveau composant
PlanDeactivateDialog, partagé) ; échecs de désactivation, réactivation et étapes affichés
(StatusCallout, hook usePlanActionError, annulation de motif silencieuse) ; colonne « Créé
par » sur created_by_name ; texte et refus 409 affichés dans la fenêtre d'ajout d'un domaine ;
code mort ActionSubcategoriesSection retiré, apostrophes échappées dans les fichiers touchés.

Résultat : scripts/check.sh vert, npm run build ok, npm test 28/28. ESLint : aucune erreur
nouvelle sur les fichiers touchés ; restent préexistantes max-lines de AdminRefActionsSection,
PartsTab, complexité de useParts.

Non vérifié (à l'écran) : fenêtre de motif et confirmation de désactivation, messages
d'erreur du Préventif, refus 409 réel (dépend de SUIT-01), colonne « Créé par ».

Contrôle de l'agent principal (2026-11-15) : ajout de domaine, erreur affichée une seule
fois (dans la fenêtre) ; suppression refusée (409) gérée, plus de rejet non géré ;
check.sh et build verts. Essai à l'écran à faire par l'utilisateur.
