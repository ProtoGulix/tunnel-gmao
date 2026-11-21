# TPE-02. Le backend applique les types permis par classe

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : backend-dev
- Branche : feat/types-par-equipement (worktree ../wt-tpe-02, après TPE-01)
- Dépend de : ADR 0031 (points 2 à 5), TPE-01
- Périmètre d'écriture : backend/api/ (interventions/types.py, interventions, intervention_requests
  pour la création depuis une demande, equipement_class), backend/tests/, docs/api/endpoints/,
  CHANGELOG.md, cette fiche. Exclu : alembic, schema.sql, fronts.

## Contexte

Types en base et `check_assignable` (backend/api/interventions/types.py), lecture des types
`GET` dans backend/api/interventions/routes.py (vers la ligne 75), classes dans
backend/api/equipement_class/, type suggéré d'une demande lu par `insert_intervention`
(ADR 0026). Création atomique : ADR 0025.

## Critères d'acceptation

- [x] Une fonction unique `allowed_type_codes(machine_id)` (None = tous) sert au refus et à
      la lecture filtrée.
- [x] Refus (400, message avec les types permis) à la création et quand type ou équipement
      changent ; intervention existante non permise modifiable si ni type ni équipement ne
      changent.
- [x] Création depuis une demande : un type suggéré non permis n'est pas imposé (le type
      choisi doit être permis) ; un type suggéré permis garde l'ADR 0026.
- [x] Lecture des types avec `machine_id` : seulement les types permis (actifs) ; sans
      `machine_id` : inchangé.
- [x] Administration d'une classe : lire et remplacer sa liste de types permis (codes
      existants seulement), même droit que la modification d'une classe, route déclarée à
      l'audit ; la classe renvoyée porte `allowed_intervention_types`.
- [x] Tests : classe sans liste (tout permis), classe avec liste (refus et succès),
      équipement sans classe, changement d'équipement, intervention existante non permise,
      type suggéré non permis puis permis, lecture filtrée, droits de l'administration.
- [x] Docs des endpoints ; scripts/check.sh vert ; test-integration.sh complet vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Règle unique `allowed_type_codes(machine_id, cur=None)` dans interventions/types.py (None = tous),
utilisée par `check_allowed_for_machine` (refus : création via validate_create, `update` si type
ou équipement change) et `list_types_for_machine` (lecture filtrée). Acceptation d'une demande :
un type suggéré non permis est écarté (ni imposé ni par défaut). Administration : routes
`GET`/`PUT /equipement-class/{id}/intervention-types`, PUT déclaré à l'audit (`equipement_class`,
événement `intervention_types_changed` seulement si la liste change). Droit : aucune entrée de
matrice codée ; la route est dans le même module que le PATCH, donc la matrice par défaut (RESP et
ADMIN) s'applique au bootstrap. Sur une base déjà installée, le nouvel endpoint est créé fermé à
RESP par la synchronisation du catalogue : l'administrateur doit l'ouvrir dans l'écran des droits
(ou relancer le bootstrap), aucune migration de données faite. Tests : 16 d'intégration
(test_tpe02_types_permis_integration.py) ; pytest 483 passed ; intégration complète 563
passed, 0 failed après mise à jour des comptes de la matrice par défaut (263 endpoints : +GET et +PUT);
check.sh vert.

Correctif (décision de l'agent principal) : exemption du préventif dans la fonction unique
(`allowed_type_codes(..., from_plan=True)` ajoute PRE ; `is_preventive_origin` détecte `plan_id`
ou une demande liée à une occurrence, ce qui couvre l'acceptation manuelle, qui ne porte pas
plan_id avant l'insertion). Le type suggéré PRE d'une demande préventive reste donc imposé
(ADR 0026). 3 tests ajoutés : génération auto-acceptée et acceptation manuelle sur une classe
limitée à CUR (PRE créé), PRE manuel sans plan refusé.
