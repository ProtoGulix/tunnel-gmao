# REO-04. Rouvrir une intervention rouvre son occurrence préventive

- Statut : faite (2026-11-20)
- Agent : principal (petite correction)
- Branche : fix/occurrence-rouverte (depuis develop)
- Dépend de : ADR 0028 (amendement du 2026-11-20), ADR 0029
- Périmètre d'écriture : backend/api/preventive_occurrences/cascade.py,
  backend/api/interventions/repo.py, backend/tests/integration/, ADR 0028, backlog, CHANGELOG,
  ETAT, cette fiche.

## Contexte

La réouverture (ADR 0028) rouvrait la demande mais laissait l'occurrence « completed » :
le préventif comptait comme fait alors que l'intervention était rouverte. Décision de
l'utilisateur du 2026-11-20 : l'occurrence repasse « en cours ».

## Critères d'acceptation

- [x] Réouverture acceptée : occurrence « completed » → « in_progress », événement du système
      (SYSTEM_CASCADE, auteur du jeton) ; test_rouvrir_repasse_l_occurrence_en_cours_et_trace.
- [x] Nouvelle clôture : occurrence de nouveau « completed » ; test_reclore_termine_de_nouveau_l_occurrence.
- [x] Réouverture refusée (sans motif) : occurrence inchangée ; test_refus_de_reouverture_ne_touche_pas_l_occurrence.
- [x] scripts/check.sh vert ; test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

`reopen_occurrences` (preventive_occurrences/cascade.py) appelé avec `reopen_linked_request`
dans la transaction de la réouverture. 4 tests d'intégration nouveaux, verts avec les 7 de
REO-02 ; test de /repair ajouté après la relecture (une occurrence rouverte n'est pas reclose), événement de réouverture identifié par son ancien statut (relecture : le premier test ne distinguait pas l'événement de la génération). Pas de migration, pas de changement d'API, rien côté fronts.
