# CSV-01. Backend : suivi de la demande d'un constat, suppression refusée

- Statut : faite
- Agent : backend-dev (sonnet)
- Branche : fix/constat-suivi-et-vues-csv01 (worktree depuis fix/constat-suivi-et-vues)
- Dépend de : ADR 0043 (constat), ADR 0038 (rejet avec motif)
- Périmètre d'écriture : backend/api/constats/, backend/api/intervention_requests/,
  backend/api/interventions/repo.py (suppression seulement), backend/tests/,
  docs/api/endpoints/constats.md et la doc d'endpoint des demandes. Pas de migration.

## Contexte

Demande de l'utilisateur du 2026-11-23 : un constat reste toujours visible, avec l'état de la
demande qui en découle, sinon les doublons se multiplient. L'écran doit pouvoir dire, sans
appel de plus : en attente, acceptée (vers quelle intervention), rejetée (avec quel motif),
rattachée. Aujourd'hui « Supprimer » sur une demande issue d'un constat finit en erreur de base
(clé étrangère constat.request_id).

## Contrat (ajouts seulement, rien de retiré)

Constat (GET /interventions/{id}/constats, /constats/by-request/{id}, /constats/{id}) :

- `request_status_label`, `request_status_color` : depuis request_status_ref.
- `request_intervention_id`, `request_intervention_code` : intervention créée à l'acceptation
  (intervention_request.intervention_id), null sinon.
- `request_reject_reason` : libellé du motif d'audit du dernier passage à « rejetee » de la
  demande (audit_log entity_type = 'request', decision_type = 'statut_changed',
  new_value statut = rejetee, joint à audit_reason_code), suivi de reason_text s'il existe ;
  null si la demande n'est pas rejetée.
- chaque réponse gagne `question_label` (libellé de constat_question).
- `source_intervention_code` (constat.intervention_id → intervention.code), utile à la fiche
  de la demande.

Demande (liste et détail) : `source_intervention_code` à côté de `source_intervention_id`.

Suppression : DELETE d'une demande citée par un constat (request_id ou linked_request_id) est
refusé par une ValidationError au message court (« Demande issue d'un constat : à rejeter, pas à
supprimer. » ou plus court), pas d'erreur de base. Même règle pour la suppression d'une
intervention qui porte des constats ou dont la demande est citée par un constat.

## Critères d'acceptation

- [x] champs du contrat renvoyés, requêtes paramétrées, une lecture par liste (pas de N+1)
- [x] motif de rejet : test d'intégration avec un rejet REJECT_ALREADY_HANDLED et un rattachement
      (REJECT_DUPLICATE) ; null pour une demande nouvelle
- [x] acceptation : `request_intervention_code` renseigné (test)
- [x] suppression refusée (demande d'un constat, idée rattachée, intervention avec constats) :
      4xx avec message, aucune ligne supprimée (tests)
- [x] docs d'endpoints à jour ; check.sh et test-integration.sh verts, aucune assertion affaiblie

## Compte rendu final

Fait : le constat expose l'état de sa demande (libellé, couleur, intervention créée, motif de
rejet depuis audit_log, `question_label`, `source_intervention_code`) en une lecture par liste ;
la demande expose `source_intervention_code`. Suppression refusée (400) d'une demande citée par
un constat et d'une intervention qui porte des constats ou dont la demande est citée.
Tests : `backend/tests/integration/test_csv01_suivi_constat_integration.py` (7). Aucune migration.
