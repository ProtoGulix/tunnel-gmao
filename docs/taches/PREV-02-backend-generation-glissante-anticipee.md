# PREV-02. Backend : génération glissante et anticipée d'une semaine

- Statut : faite (2026-11-18)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev02
- Dépend de : PREV-01 (fonction de calcul)
- Périmètre d'écriture : backend/api/preventive_occurrences/repo.py, backend/tests/,
  docs/api/endpoints/ (fichier du domaine), CHANGELOG.md (« Non publié »). Exclu :
  routes, tâche planifiée (PREV-04), web, mobile, migrations.

## Contexte

`_generate_for_machine` (repo.py, vers la ligne 325) part de `MAX(scheduled_date)` des
occurrences closes (périodicité fixe) et ne crée l'occurrence que le jour où elle est
due. Décision de l'utilisateur du 2026-11-18 : périodicité glissante, référence = date
de clôture de la demande, et demande créée une semaine avant l'échéance pour laisser
l'équipe s'organiser.

## Critères d'acceptation

- [x] La génération utilise la fonction de calcul de PREV-01 (aucune seconde règle
      d'échéance) : une occurrence est créée quand l'échéance ≤ aujourd'hui +
      prévenance, avec `scheduled_date` = échéance (date future possible)
- [x] Tests : référence = date de clôture et non `scheduled_date` (une clôture tardive
      décale l'échéance suivante) ; rien créé à J-8 ; créé à J-7 ; occurrence active
      existante toujours respectée ; un second appel le même jour ne crée rien
- [x] Plans `hours` : comportement inchangé
- [x] Rapport de `POST /generate` inchangé dans sa forme (clients existants)
- [x] Audit inchangé : génération manuelle toujours tracée comme aujourd'hui (AUDC-24)
- [x] Vérifier si `intervention_request.deadline` désigne une échéance ; si oui, la
      renseigner avec l'échéance, sinon le noter dans le compte rendu
- [x] scripts/check.sh et test-integration.sh verts
- [x] CHANGELOG (« Non publié ») : la règle passe de fixe à glissante, les échéances
      des plans existants se déplacent

## Compte rendu final

Fait : `_generate_for_machine` (plans periodicity) calcule l'échéance avec
`schedule.compute_due` et `settings.PREVENTIVE_LEAD_DAYS` ; la référence vient de la
constante SQL `_LAST_TERMINATED_LATERAL`, partagée avec `get_schedule`. Plans hours, garde
« occurrence active », rapport de POST /generate et audit inchangés.

`intervention_request.deadline` : colonne `date` nullable, champ de qualification d'une DI
(exposée en édition et affichée sur les cartes d'amélioration). Elle désigne bien une date
d'échéance : la DI système la reçoit désormais avec `scheduled_date` (aussi pour les plans
hours, où c'est aujourd'hui).

Tests : tests/integration/test_preventif_generation_glissante_integration.py (J-8, J-7,
clôture tardive, occurrence active, second appel, sans historique). Aucun test existant
modifié. check.sh : 399 passed ; test-integration.sh : 374 passed.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre, aucun test
existant modifié, règle de référence partagée avec l'échéancier (une seule constante SQL)
relue ; après fusion, check.sh vert et test-integration.sh vert (374 passed). `deadline`
des plans hours à aujourd'hui : conservé (la DI est due tout de suite). NON VÉRIFIÉ :
génération sur les données réelles de dev (aucune écriture).
