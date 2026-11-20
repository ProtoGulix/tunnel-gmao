# CASC-02. La demande ne ferme plus son intervention, transitions permises dans l'API

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ)
- Agent : backend-dev
- Branche : fix/audit-des-cascades (worktree ../wt-casc-02)
- Dépend de : ADR 0029 (points 1, 2, 5 dernière phrase)
- Périmètre d'écriture : backend/api/intervention_requests/, backend/tests/,
  docs/endpoints/ (domaine des demandes), CHANGELOG.md, cette fiche. Exclu : alembic,
  schema.sql, fronts, autres domaines.

## Contexte

`transition_status` vers « cloturee » appelle `_close_linked_intervention`
(backend/api/intervention_requests/repo.py, vers les lignes 770 et 938) : `UPDATE
intervention SET status_actual='ferme'` brut, sans `_check_closable`, sans événement, puis
occurrence passée à completed avec un simple log. Les fronts recopient
`ALLOWED_TRANSITIONS` (validators.py:7) et divergent.

## Critères d'acceptation

- [x] Transition vers « cloturee » refusée (400, message « Clore l'intervention : elle
      clôturera la demande. ») si la demande a une intervention non fermée ; acceptée sans
      intervention ou avec intervention fermée ; jamais d'écriture sur l'intervention.
      `_close_linked_intervention` supprimé (et ce qu'il ne sert plus).
- [x] Champ `allowed_transitions: list[str]` dans chaque demande renvoyée (liste, détail,
      réponse de transition), calculé par une fonction unique du validator d'après le
      statut, l'intervention liée (statut fermé ou non) et la permission de l'utilisateur
      pour la transition ; même valeur quel que soit le client.
- [x] Le motif de la décision n'est plus recopié sur un événement de cascade
      (intervention_requests/repo.py vers la ligne 1098 : `SYSTEM_CASCADE`, is_system).
- [x] Tests : refus avec intervention ouverte (aucune ligne modifiée sur l'intervention) ;
      succès avec intervention fermée et sans intervention ; `allowed_transitions` pour
      chaque statut, avec et sans intervention ouverte, et pour un rôle sans droit de
      transition.
- [x] Documentation de l'endpoint mise à jour.
- [x] scripts/check.sh vert ; test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Fait : `_close_linked_intervention` supprimé ; refus 400 de la clôture avec intervention
ouverte (validator, `intervention_status` passé par le repo) ; `compute_allowed_transitions`
(validators.py) unique, appelé par les routes (liste, détail, transition) avec la permission
déduite de la matrice (`permission_cache` + `endpoint_code`) ; champ `allowed_transitions`
dans le schéma de liste. Le point « motif recopié sur un événement de cascade » : aucune
recopie trouvée dans le code actuel (les événements SYSTEM_CASCADE du module ne reprennent
pas le motif de la décision), rien à retirer. `/repair` inchangé (CASC-03).
Tests : `tests/test_demande_transitions_autorisees.py` (unitaires),
`tests/integration/test_casc02_cloture_demande_integration.py` (4 cas). Aucun test existant
adapté.
