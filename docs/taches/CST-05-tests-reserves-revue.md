# CST-05. Tests : réserves de la revue du chantier

- Statut : faite
- Agent : test-writer (sonnet)
- Branche : feat/constat-intervention-cst05 (worktree depuis feat/constat-intervention)
- Dépend de : CST-02, revue du chantier (APPROUVÉ AVEC RÉSERVES, 2026-11-22)
- Périmètre d'écriture : backend/tests/ seulement. Exclus : code de production, docs.

## Contexte

Le reviewer relève des chemins de backend/api/constats/ sans test d'intégration, et un doute sur
une double ligne d'audit au rattachement (`link_to_idea`, rejet par `transition_status`).

## Critères d'acceptation

- [x] correction d'une version déjà remplacée : 409 (test)
- [x] correction sans motif : 400 avec `audit.reasons` ; motif invalide : 400 (tests d'intégration)
- [x] rattachement d'un constat déjà rattaché : 400 (test)
- [x] rattachement : le nombre de lignes d'audit du rejet de la demande est constaté et attendu
      exactement (une décision de rejet) ; si le code en écrit deux, le test le montre et
      l'écart est signalé, sans corriger le code
- [x] `cur_sans_constat` limitée aux tests qui ferment, si c'est simple ; sinon laissée et dit
- [x] scripts/check.sh et scripts/test-integration.sh verts, aucune assertion existante affaiblie

## Compte rendu final

Fait : `backend/tests/integration/test_cst05_constat_reserves_integration.py`, 5 tests.

- `test_correction_d_une_version_remplacee_est_refusee_en_409` : 409, aucune ligne d'audit ni version en plus.
- `test_correction_sans_motif_est_refusee_avec_les_motifs_proposes` : 400, `audit.reasons`.
- `test_correction_avec_un_motif_invalide_est_refusee` : motif inconnu et motif d'une autre décision, 400.
- `test_rattachement_d_un_constat_deja_rattache_est_refuse` : 400, lien d'origine conservé.
- `test_rattachement_ecrit_une_seule_decision_de_rejet` : une seule ligne d'audit (`statut_changed`, `rejetee`) sur la demande ; aucun doublon, aucun défaut, pas de xfail.

`cur_sans_constat` : déjà limitée aux tests qui ferment (6 fichiers), laissée telle quelle.
Tests : check.sh vert, test-integration.sh vert.
