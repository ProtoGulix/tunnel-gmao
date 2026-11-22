# PRIO-02. Backend : priorité validée, plus aucune écriture de `normale`

- Statut : faite (2026-11-21), essai à l'écran validé (2026-11-22)
- Agent : backend-dev
- Branche : feat/priorites-et-statuts (depuis develop, ADR 0008)
- Dépend de : ADR 0039 ; parallèle possible avec PRIO-01
- Périmètre d'écriture : backend/api/ (interventions, intervention_requests,
  preventive_occurrences, exports, constants), backend/tests/. Exclu : alembic/, db/,
  web/, mobile/.

## Contexte

`priority: Optional[str]` accepte toute chaîne (interventions/schemas.py:53,86,138,165).
Le backend écrit lui-même `normale` : preventive_occurrences/repo.py:900,
intervention_requests/repo.py:892 ; le tri de sévérité attend `normale`
(interventions/repo.py:205) ; le PDF ne traduit pas `normal` (exports/pdf_generator.py:78).

## Critères d'acceptation

- [x] Toute écriture de priorité (création, mise à jour, création atomique, depuis une
      demande, préventif) refuse une valeur hors de `PRIORITY_TYPES` par une erreur 400
      lisible ; `PRIORITY_TYPES` reste la seule liste (pas de copie).
- [x] Plus aucune écriture ni comparaison sur `normale` dans backend/api (grep vide).
- [x] Tri de sévérité et PDF sur `normal`.
- [x] Tests : refus de `normale` et d'une valeur inconnue, tri correct, création depuis une
      demande et depuis le préventif en `normal`. Les données de test passent de `normale`
      à `normal` sans affaiblir d'assertion.
- [x] scripts/check.sh et scripts/test-integration.sh verts.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (backend-dev, sonnet) : `InterventionValidator.validate_priority` sur PRIORITY_TYPES,
appelé par validate_create (seul point d'insertion, ADR 0025 : création, création atomique,
acceptation d'une demande, préventif) et par la mise à jour ; 400 lisible. Plus de
`normale` dans backend/api (défaut des demandes, préventif, tri de sévérité, PDF, doc du
paramètre). Données de test `normale` → `normal` dans 9 fichiers, aucune assertion retirée
(vérifié par git diff -w). Tests ajoutés : test_priorite_validator.py,
test_priorite_validee_integration.py, cas préventif dans test_audc24.

Commandes en échec, corrigées : 3 échecs de ses nouveaux tests (colonne inexistante,
conflit de code d'intervention, clé `items`), deux relances ciblées (chemin, échecs).
Reste hors fiche : les filtres de liste ignorent toujours en silence une priorité inconnue.
NON VÉRIFIÉ : rendu réel du PDF.

Contrôle de l'agent principal : périmètre conforme ; check.sh vert, test-integration.sh
621 passés sur la branche du chantier après intégration des quatre fiches.
