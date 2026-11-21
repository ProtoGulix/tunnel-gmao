# CONT-03. Ignorer une occurrence préventive : motif choisi dans la fenêtre commune

- Statut : faite (2026-11-20), essai à l'écran validé
- Agent : backend-dev (sonnet) puis frontend-dev (sonnet)
- Branche : feat/contraintes-et-audit, worktree feat/contraintes-et-audit-cont03
- Dépend de : CLAUDE.md 2.4, ADR 0016 à 0018 (audit), décision de l'utilisateur du 2026-11-19
- Périmètre d'écriture : backend/api/preventive_occurrences/ (route skip, schéma),
  données de référence des motifs d'audit (backend/db/seed_reference.sql et/ou migration de
  données : le dire, accord de l'utilisateur déjà donné pour ajouter des motifs),
  web/src (bouton « Ignorer », fenêtre de motif commune), mobile/src si le mobile ignore
  des occurrences, tests, CHANGELOG, cette fiche. Exclu : migration 0018 (CONT-01).

## Contexte

Aujourd'hui PATCH /preventive-occurrences/{id}/skip reçoit une raison libre (`skip_reason`)
et le middleware injecte le motif ROUTINE. Décision de l'utilisateur (2026-11-19) :
ignorer une occurrence est un changement hors travail normal, avec un motif choisi dans la
fenêtre de motif commune, comme les autres décisions (clôture, annulation). Motifs proposés :
machine arrêtée, fait hors de l'outil, plan obsolète, autre (avec texte).

## Critères d'acceptation

- [x] Règle d'audit de l'entité occurrence pour le skip : motif obligatoire, sans injection
      routinière ; motifs ajoutés aux données de référence (idempotent), libellés en
      français accentué
- [x] `skip_reason` (colonne exigée par la contrainte CHECK) est rempli à partir du motif
      choisi (libellé, ou texte pour « autre ») : plus de saisie de raison maison à côté du
      mécanisme
- [x] Web : « Ignorer » ouvre la fenêtre de motif commune ; mobile aligné s'il propose
      l'action
- [x] Tests d'intégration : refus sans motif, ligne d'audit avec le motif choisi, OTHER
      exige un texte
- [x] scripts/check.sh et scripts/test-integration.sh verts, builds verts
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-20, après les migrations 0018 et 0019 jouées en dev avec accord)

## Compte rendu final


Fait (2026-11-19) :

- Migration 0019_motifs_ignorer_occurrence (down_revision 0017, à rechaîner à la fusion) et
  seed_reference.sql : motifs OCCURRENCE_MACHINE_DOWN (Machine arrêtée),
  OCCURRENCE_DONE_OFFLINE (Fait hors de l'outil), OCCURRENCE_PLAN_OBSOLETE (Plan obsolète),
  catégorie user, décision occurrence_skipped ; OTHER reçoit cette décision ; la règle
  d'audit de preventive_occurrence devient non routinière et ROUTINE perd cette entité.
- Route skip : plus de corps `skip_reason` (schéma OccurrenceSkipIn supprimé) ; skip_reason
  déduit du motif par `skip_reason_from_choice` (libellé, ou texte pour OTHER).
- Web : « Ignorer » demande le motif via la fenêtre commune (auditGuard, décision
  occurrence_skipped) ; la saisie libre est retirée. Mobile : n'ignore pas d'occurrences,
  rien à changer.
- Tests : intégration (refus sans motif valide, audit avec le motif, OTHER avec texte,
  migration), unitaires du validator, test web de la décision. Assertion de tête de
  test_bootstrap_integration.py passée à 0019 (à rechaîner à la fusion avec 0018).
