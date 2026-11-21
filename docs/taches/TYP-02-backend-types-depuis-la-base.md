# TYP-02. Backend : les types lus en base

- Statut : faite, relue, migration 0020 jouée en dev, essai à l'écran validé (2026-11-20)
- Agent : backend-dev (sonnet)
- Branche : feat/types-intervention-en-base, worktree de la sous-branche
  feat/types-intervention-en-base-typ02
- Dépend de : TYP-01, ADR 0026
- Périmètre d'écriture : backend/api/constants.py (retrait des types), backend/api/
  interventions/, intervention_requests/, equipements/repo.py, exports/repo.py,
  admin/ (référentiel des types), un module partagé de lecture des types si utile,
  backend/tests/, docs/api/endpoints/ (interventions, admin), CHANGELOG.md, cette fiche.
  Exclu : migrations, fronts, dépendances.

## Contexte

Usages actuels des constantes : interventions/routes.py (GET /types), validators.py et
repo.py (INTERVENTION_TYPE_IDS), intervention_requests/schemas.py, equipements/repo.py
(santé, statistiques par type), exports/repo.py (libellé). Admin : admin/referentiel_repo.py
(list, create_intervention_type, update).

## Contrat (fixé pour les fronts)

`GET /interventions/types` → liste `[{ "id": "CUR", "title": "Curatif", "color": "red",
"description": "...", "is_active": true }]`, triée par libellé ; `?include_inactive=true`
renvoie aussi les inactifs (affichage de l'historique). Forme existante conservée (id,
title, color), champs ajoutés.

## Critères d'acceptation

- [ ] Plus aucune constante de type dans le backend ; une fonction unique lit les types
      (une requête, pas de cache inter-processus douteux) et sert routes, validators,
      schémas, santé, exports
- [ ] Création et modification d'intervention, suggested_type_inter d'une demande, filtres :
      type inconnu ou inactif refusé avec un 400/422 lisible (inactif refusé seulement pour
      une nouvelle valeur) ; tests
- [ ] Administration : libellé, couleur, description, actif modifiables ; code non
      modifiable ; suppression d'un type utilisé refusée avec un message clair (désactiver) ;
      audit inchangé ; tests d'autorisation
- [ ] docs/api/endpoints et CHANGELOG à jour
- [ ] scripts/check.sh vert, scripts/test-integration.sh vert

## Compte rendu final


Fait (branche feat/types-intervention-en-base-typ02). Module partagé
backend/api/interventions/types.py : une requête par appel, sans cache (plusieurs processus
API ne s'invalideraient pas entre eux ; la table est minuscule). `read_types(cur)`,
`list_types`, `get_type_labels`, `check_known` (filtres : inactif accepté),
`check_assignable(code, current)` (inconnu ou inactif refusé en 400, inactif accepté si
inchangé). Constantes retirées de constants.py. Câblage : GET /interventions/types
(`include_inactive`), validate_create et update (type vérifié seulement s'il change),
filtres, suggested_type_inter (validé dans InterventionRequestValidator.validate_create, le
validator Pydantic est retiré), santé et statistiques par type des équipements (types
inactifs utilisés gardent leur libellé ; code hors référentiel -> null « Non renseigné » par
sûreté), export (libellé). L'update d'intervention passe par raise_db_error (plus de message
brut). Administration : description et color ajoutées (création et modification), code non
modifiable (ignoré), liste admin renvoie description et color ; aucune route de suppression
(inchangé). Audit et autorisation inchangés. Test existant corrigé : le rejeu de 0018 dans
test_contraintes_production reposait chk_suggested_type_inter dans la base de session.
