# CDL-02. Backend : demande selon le levier, constat sans demande

- Statut : faite (2026-11-26)
- Agent : backend-dev (sonnet)
- Branche : feat/constat-demande-selon-levier-cdl02 (worktree depuis feat/constat-demande-selon-levier, après CDL-01)
- Dépend de : ADR 0045, CDL-01 (migration 0029)
- Périmètre d'écriture : backend/api/constats/, backend/api/stats/constats_repo.py (et schemas.py si besoin), leurs tests dans backend/tests/ et backend/tests/integration/, docs/api/endpoints/ (constats, stats). Rien dans backend/api/admin/ (CDL-04 en parallèle).

## Contexte

ADR 0045 points 1 à 4 et 6. Aujourd'hui `ConstatRepository.create` crée toujours une demande ;
le levier est obligatoire, aucun choix exclusif. Plusieurs requêtes joignent
`intervention_request` en JOIN interne (repo.py, `_fetch`) : un constat sans demande y
disparaîtrait. Les indicateurs (ADR 0044) datent un constat par sa demande.

## Travail

1. Formulaire (`list_questions`, `_load_form`) : chaque choix expose `creates_request` et `is_exclusive`.
2. Validation : un choix exclusif coché avec un autre choix de sa question → ValidationError
   (« Choix exclusif : <libellé> »). `validate_and_prepare` renvoie aussi `creates_request`
   (vrai si au moins un choix coché le porte). Aucun code de choix en dur.
3. Création : demande seulement si `creates_request` ; sinon constat avec `request_id` NULL, sans
   événement de création de demande.
4. Correction :
   - avec demande : règle actuelle (demande « nouvelle », auteur ou référent), demande mise à jour ;
     si la nouvelle version ne génère plus de demande, la demande reste telle quelle (description
     mise à jour) ;
   - sans demande : auteur ou référent, intervention non archivée ; si la nouvelle version génère
     une demande, elle est créée (même chemin que la création) et liée à la nouvelle version.
   - `can_correct` exposé aux fronts suit ces règles.
5. Lectures : JOIN vers la demande en LEFT JOIN ; champs de la demande nullables dans la réponse.
6. Rattachement à une idée : refusé (ValidationError) pour un constat sans demande.
7. Indicateurs : un constat est daté par la première version de sa chaîne (supersedes_id), plus
   par sa demande ; `outcomes` ne compte que les constats avec demande ; leviers et signaux
   comptent tous les constats ; NOTHING apparaît dans les leviers.
8. Doc d'endpoints : champs nouveaux et nullables.

## Contrat pour les fronts (CDL-03)

- Formulaire : chaque choix porte `creates_request` et `is_exclusive` (booléens).
- Constat lu : `request_id` et les champs de la demande peuvent être `null` ; `can_correct` inchangé de forme.

## Critères d'acceptation

- [x] tests : exclusif seul accepté, exclusif combiné refusé
- [x] tests d'intégration : constat « Rien » sans demande ; constat formation seule sans demande ; constat tâche régulière avec demande PRE
- [x] tests : correction sans demande vers levier générateur crée la demande ; correction avec demande vers « Rien » garde la demande ; droits de correction sans demande (auteur, RESP, autre TECH refusé, intervention archivée refusée)
- [x] test : lecture d'un constat sans demande (liste de l'intervention, détail)
- [x] test : rattachement refusé sans demande
- [x] tests des indicateurs : datation par la chaîne, outcomes sans les constats sans demande
- [x] aucune assertion existante affaiblie ; scripts/check.sh vert ; scripts/test-integration.sh vert

## Compte rendu final


Fait. Formulaire : `creates_request` et `is_exclusive` par choix. Validation : exclusif combiné
refusé (« Choix exclusif : <libellé> »), `creates_request` calculé, aucun code en dur. Création :
demande seulement si un choix la génère. Correction : sans demande (auteur ou référent,
intervention non archivée), la demande naît si la nouvelle version la génère (notifiée) ; avec
demande, elle reste (machine et texte mis à jour, type recalculé seulement si la version génère
encore une demande). `can_correct` tient aussi compte de l'archivage. Lectures en LEFT JOIN.
Rattachement refusé sans demande (400). Indicateurs : datation par la chaîne `supersedes_id`
(CTE récursive), `outcomes` limité aux constats avec demande.

Fichiers : backend/api/constats/{repo,routes,validators}.py, backend/api/stats/constats_repo.py,
tests (test_constats.py, test_cst_cdl02_constat_sans_demande_integration.py, test_stats_constats_integration.py),
docs/api/endpoints/{constats,stats}.md. Le jeu du test d'indicateurs a changé (formation seule
n'a plus de demande) : totaux et compteurs mis à jour, aucune assertion affaiblie.

Contrat final pour les fronts (CDL-03) :

- `GET /constats/questions` : chaque choix porte `creates_request` et `is_exclusive` (booléens).
- Constat lu : `request_id`, `request_code`, `request_status*`, `suggested_type_inter`,
  `request_intervention_*`, `linked_*` peuvent être `null` (constat sans demande).
- `can_correct` : même forme ; faux si l'intervention est archivée ; sans demande, vrai pour
  l'auteur et RESP/ADMIN ; avec demande, tant qu'elle est « nouvelle ».
- Corriger un constat sans demande vers un levier générateur renvoie un constat avec `request_id`.
- `POST /constats/{id}/link` sans demande : 400. `GET /constats/by-request/{id}` : inchangé.
- Choix exclusif combiné : 400 « Choix exclusif : <libellé> ». Les fronts décochent les autres
  choix de la question quand un exclusif est coché.
- `GET /stats/constats` : `levers` inclut NOTHING ; `outcomes` ne compte que les constats avec demande.
