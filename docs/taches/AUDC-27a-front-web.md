# AUDC-27a. Front web de l'étape 2

- Statut : faite (2026-11-14), essai à l'écran à faire
- Agent : frontend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-22 à AUDC-30 (backend de l'étape 2), ADR 0019
- Périmètre d'écriture : `web/src/` seulement, tests front de web, CHANGELOG (section
  « Non publié », effet visible). Exclus : backend, mobile, docs d'API.

## Contexte

Backend de l'étape 2 (voir CHANGELOG « Non publié », AUDC-plan décision 7, ADR 0019) :
- toute suppression exige un motif explicite (400 du middleware sinon) ; les motifs de
  suppression sont ceux dont `decision_types` contient `deleted` (DELETE_CREATED_BY_MISTAKE,
  DELETE_DUPLICATE, OTHER avec texte) ;
- DELETE /interventions/{id}?request_outcome=reopen|delete : choix obligatoire si une
  demande est liée (400 sinon) ; `delete` refusé si la demande est liée à une occurrence
  préventive ; intervention fermée jamais supprimable ;
- POST /interventions exige request_id ;
- import CSV des demandes d'achat : 422 avec le rapport complet quand une ligne est
  invalide (rien n'est écrit) ;
- motifs codés en dur à retirer : CloseInterventionOverlay.jsx:42 et
  ActionFormContext.jsx:97 (`'ROUTINE'`) : le backend applique la règle routinière seul ;
- `web/src/lib/api/auditGuard.js` `_URL_ENTITY_MAP` : ajouter supplier-orders
  (supplier_order), equipements (equipement), preventive-occurrences
  (preventive_occurrence).

## Critères d'acceptation

- [x] fenêtre de suppression d'intervention : la fenêtre de motif commune
      (AuditReasonDialog / AuditReasonPicker) avec le choix de l'issue de la demande
      (« Rouvrir la demande » / « Supprimer aussi la demande ») ; « Supprimer aussi » absent
      ou désactivé avec explication pour une demande préventive ; bouton Supprimer masqué
      ou désactivé pour une intervention fermée ; intervention sans demande : pas de choix
- [x] chaque suppression du web (intervention, demande, tâche, action, demande d'achat,
      commande fournisseur, équipement) ouvre la fenêtre de motif filtrée sur `deleted`
      et envoie reason_code (et reason_text pour OTHER) ; aucune saisie de raison maison
- [x] plus aucune chaîne 'ROUTINE' (ni autre code de motif) dans web/src hors
      administration des motifs
- [x] auditGuard complété ; un 400 de motif manquant sur ces entités ouvre la fenêtre
- [x] import CSV : un 422 affiche le rapport ligne par ligne, pas un message générique
- [x] création d'intervention : écrans recensés ; aucun ne crée d'intervention sans
      demande (liste des écrans dans le compte rendu)
- [x] tests front pour la logique ajoutée (filtre `deleted`, choix d'issue, auditGuard) ;
      check.sh vert (build web, tests web) ; CHANGELOG

## Compte rendu final

Fait (web/src seulement, CHANGELOG) :
- Fenêtre de motif commune : `decisionType` (filtre sur `decision_types`) dans
  AuditReasonPicker / AuditReasonDialog / AuditGuardDialog / useAuditGuard ; une requête DELETE
  interceptée par auditGuard demande un motif « deleted ». Pas de motif disponible : message
  explicite dans la fenêtre. Logique pure dans `lib/api/auditEntity.js` (carte des entités
  complétée : supplier-orders, equipements, preventive-occurrences) et `auditReasonFilter.js`.
- Intervention : `DeleteInterventionDialog` (motif + choix « Rouvrir la demande » / « Supprimer
  aussi la demande », grisé pour une demande système, sans choix sans demande) ; bouton grisé
  avec explication pour une intervention fermée ; DELETE envoie corps `reason_code` /
  `reason_text` et `request_outcome` ; règles dans `deleteInterventionRules.js`.
- Demande d'achat par lot : un seul motif pour le lot (envoyé demande par demande). Demande,
  action, tâche, demande d'achat, commande : motif demandé par le guard après le 400 ; fermeture
  de la fenêtre traitée sans message d'erreur.
- 'ROUTINE' retiré (CloseInterventionOverlay, ActionFormContext, createIntervention).
- Import CSV : le 422 affiche `CsvImportRejectedReport` (lignes en erreur et raisons).
- Création d'intervention : voir ci-dessous. Tests : auditGuard.test.js,
  deleteInterventionRules.test.js, csvImportReport.test.js.

Écrans de création d'intervention (appelant de `createIntervention`) :
1. InterventionCreateModal : crée une demande directe si aucune choisie, sinon la demande
   choisie (conforme).
2. DayContextRightColumn (planning) : idem, demande créée à la volée (conforme).
3. InterventionCreatePage / useInterventionCreate : permettait la création sans demande ;
   corrigé, crée une demande directe (origine « directe ») avec l'intervention.
4. InterventionSelector (planning) : formulaire visible seulement avec une demande ; garde
   ajoutée dans la soumission.
5. ActionFormContext (saisie d'action) : garde ajoutée dans la soumission (demande exigée).

Résultat : check.sh vert (backend, builds web et mobile, CHANGELOG, 24 tests web).

NON VÉRIFIÉ : rien essayé à l'écran ni contre l'API (pas de stack de dev) ; que le motif
`deleted` de catégorie `manual` existe en base pour `request`, `task`, `action`,
`supplier_order` (le picker filtre sur la catégorie manual) ; le comportement du backend sur
les lignes exclues d'un import 422.

Contrôle de l'agent principal (2026-11-14) : défaut antérieur trouvé et corrigé :
fetchAuditReasons ne chargeait que la catégorie manual, d'où OTHER, les motifs de
clôture et de suppression (catégorie user) absents de la fenêtre ; elle charge
maintenant manual et user, jamais auto ni system (selectableReasons, test ajouté).
check.sh vert (25 tests web). À vérifier à l'écran par l'utilisateur.

Essai à l'écran de l'utilisateur (2026-11-14) : panne « Button is not defined » (import
retiré à tort, corrigé) ; fenêtre de suppression « Aucun motif disponible » : GET
/audit/reasons lisait decision_types en base mais AuditReasonOut ne l'exposait pas
(champ ajouté à la réponse, test qui échouait avant le correctif). Même défaut dans la liste
jointe au 400 du middleware (build_picker_reasons, AuditRuleReason) : corrigé, test qui
échouait avant (KeyError decision_types).
