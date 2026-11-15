# AUD-04. Audit des tâches : une seule écriture par changement

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : fix/audit-integrite
- Dépend de : AUD-02, AUD-03
- Périmètre d'écriture : `backend/api/intervention_tasks/repo.py`, tests AUD-01 et CLO
  (retirer xfail, adapter un comptage de lignes en le justifiant).

## Critères d'acceptation

- [x] un PATCH de tâche écrit une ligne d'audit par champ modifié, pas deux ; la source
      retenue est justifiée (middleware ou repo)
- [x] reason_text, changed_by et motif toujours présents (tests CLO inchangés sinon)
- [x] scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : inventaire des sources d'audit par route ; seuls PATCH et
DELETE de tâche étaient tracés deux fois (repo et middleware). Liste blanche
`_AUDITED_BY_REPO` dans le middleware : le motif reste validé avant la route, plus
d'écriture après. `closed_by`, que seul le middleware traçait, est tracé par le repo.
Transitions de demande : decision_type différents (status_transitioned, statut_changed),
pas de doublon, inchangées. Tests ajoutés : une mutation d'intervention garde une ligne
(middleware), la clôture garde closed_by_changed.
Agent principal : marqueur xfail AUD-04 retiré, docstrings corrigées, backlog
audit-taches-double-ecriture.md supprimé (résolu) ; check.sh vert ;
test-integration.sh 107 passed, aucun xfail restant.
NON VÉRIFIÉ : DELETE de tâche réel sans test d'intégration ; le middleware ne valide pas
le motif d'un DELETE (backlog audit-trous-relevés-aud05.md).
