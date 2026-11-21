# REJ-02. Le rejet d'une demande exige un motif choisi

- Statut : faite (2026-11-21)
- Agent : backend-dev (sonnet)
- Branche : fix/motif-de-rejet
- Dépend de : REJ-01, ADR 0038
- Périmètre d'écriture : backend/api/intervention_requests/ (validators, routes si besoin), backend/api/audits/ seulement si indispensable (le dire), backend/tests/, docs du guide qui décrivent le rejet (docs/site/responsable/demandes.md), docs/cahier-fonctionnel.md (ligne du rejet), CHANGELOG.md, cette fiche

## Critères d'acceptation

- [x] rejet sans motif : refus avec le contrat « motif requis » habituel, proposant les motifs de rejet ; avec un motif de rejet : 200 et ligne d'audit avec ce motif
- [x] acceptation et mise en attente toujours sans motif
- [x] « Autre raison » sans texte refusé (existant)
- [x] tests d'intégration qui échouent avant ; check.sh et test-integration.sh verts
- [x] guide et cahier remis à jour

## Compte rendu final

Fait : `ensure_reject_reason` (validators.py, calqué sur `ensure_reopen_reason`) appelé par la route de transition quand `status_to = rejetee` ; erreur `AuditReasonRequiredError` avec les seuls motifs `request_rejected`. Aucun changement dans backend/api/audits/ ni dans le web (la fenêtre commune affiche les motifs de `audit.reasons`).
Tests : `test_rej02_rejet_exige_un_motif_integration.py` (6 ; 2 échouaient avant).
Écart noté : la ligne d'audit du rejet garde le type `statut_changed` (écrit par le middleware, comme `status_actual_changed` pour la réouverture) ; `request_rejected` ne sert qu'à filtrer les motifs.
Détail web : le titre de la fenêtre reste « Raison de la modification ».
