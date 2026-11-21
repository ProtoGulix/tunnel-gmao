# Trous d'audit relevés pendant AUD-05 (2026-11-13)

Mise à jour du 2026-11-19 (CONT-02).

- Création automatique de demande par le préventif (preventive_occurrences/repo.py) :
  aucune ligne d'audit. À tracer avec un motif system et is_system. RESTE OUVERT (CONT-03).
- TRAITÉ : suppression de tâche. `TASK_DELETED` n'est plus utilisé dans le code (il ne reste
  que la ligne de données de départ db/seed_reference.sql) ; la suppression passe par la
  route déclarée.
- TRAITÉ : /intervention-requests/repair. Test d'intégration
  `test_cont02_repair_integration.py` : un événement `status_transitioned` par demande
  réparée, is_system, motif SYSTEM_CASCADE, auteur = jeton ; second appel sans écriture.
- TRAITÉ : DELETE de tâche, `reason_text` et test de suppression (route déclarée, ADR 0018).
- TRAITÉ : `except ValidationError: raise` de `create` (intervention_requests/repo.py) :
  branche morte (le bloc n'exécute que du SQL), retirée.

## Motif LEGACY_STATUS_CHANGE encore posé sur des tâches (constat du 2026-11-20)

Lecture seule, base de dev : 59 événements de tâche (created 43, deleted 4,
due_date_changed 4, assigned_to_changed 1…) portent le motif LEGACY_STATUS_CHANGE entre
août et le 2026-11-12, alors que ce motif est inactif depuis la migration 0013. Plus aucun
depuis le 2026-11-12 (corrections d'audit du 2026-11-14 probables, NON VÉRIFIÉ). Ces
événements ne sont pas des décisions : la synthèse de l'audit (ADR 0032, SYN-01) les exclut
des décisions. Aucune correction des données passées.
