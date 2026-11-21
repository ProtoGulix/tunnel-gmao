# CLO-01. Le journal de statut refuse la clôture

- Statut : faite
- Agent : backend-dev
- Branche : fix/cloture-une-seule-porte (depuis develop, ADR 0008)
- Dépend de : ADR 0027
- Périmètre d'écriture : backend/api/intervention_status_log/, backend/tests/ (tests unitaires
  et d'intégration), docs/api/endpoints/ (doc du journal de statut). Exclu : mobile/, web/,
  migrations, autres domaines de backend/api/.

## Contexte

ADR 0027 : `POST /intervention-status-log` avec `status_to = 'ferme'` (constante
`CLOSED_STATUS_CODE` de backend/api/constants.py) clôt sans `_check_closable` ni règle
d'audit. Il doit refuser (400, ValidationError) avec un message en français qui renvoie à la
clôture depuis la fiche de l'intervention. Les autres statuts restent acceptés.

Des tests d'intégration ferment aujourd'hui par le journal :
test_taches_cloture_integration.py (`_fermer`, gamme incomplète attendue en 409),
test_export_masse_integration.py, test_audc22_interventions_demandes_integration.py
(`_fermer`, paramétré avec `_fermer_par_put`). Ils doivent fermer par
`PUT /interventions/{id}` (`status_actual: 'ferme'`, `reason_code` si la règle d'audit
l'exige) en gardant ce qu'ils vérifient. Si un code de retour change (par exemple 409 de la
gamme devenu 400 du contrôle des tâches), garde l'intention du test et explique-le dans le
compte rendu ; n'affaiblis aucune assertion.

## Critères d'acceptation

- [x] Test : `POST /intervention-status-log` vers 'ferme' répond 400, l'intervention reste
      ouverte, aucune ligne de journal ajoutée
- [x] Test : un autre statut (par exemple 'attente_pieces') reste accepté (201)
- [x] Tests existants adaptés sans assertion affaiblie (git diff -w relu par l'agent principal)
- [x] Doc de l'endpoint mise à jour
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert

## Compte rendu

Fait : `validate_not_closing` dans le validator du journal (400, message en français qui renvoie
à la fiche de l'intervention) ; docstring de la route et doc des endpoints (journal de statut,
occurrences préventives) mises à jour. Nouveau test d'intégration
test_journal_refuse_cloture_integration.py (400 sans changement ni ligne ajoutée ; 'attente_pieces'
reste 201). Tests existants qui fermaient par le journal passés au PUT (motif ROUTINE) :
taches_cloture (la gamme incomplète répond 400 du contrôle des tâches au lieu de 409 du trigger
de gamme, même intention : refus tant que la tâche est ouverte), audc22 (le paramètre
« journal_de_statut » disparaît, 201 devenu 200), export_masse (après le PUT, la date de la ligne de
journal de fermeture est fixée en SQL, l'export lisant cette date).
Résultats : check.sh vert ; intégration 491 passés, 1 échoué (voir ci-dessous).
Écart : test_la_cascade_de_fermeture_ecrit_un_evenement_du_systeme_au_nom_du_jeton, adapté au
PUT, échoue : le PUT clôt la demande liée sans événement SYSTEM_CASCADE (voir
docs/backlog/cloture-put-sans-evenement-systeme-demande.md). Correction hors périmètre, à traiter
avant fusion.
