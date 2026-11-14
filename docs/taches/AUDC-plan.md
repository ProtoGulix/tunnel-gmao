# AUDC. Audit centralisé dans le middleware : plan et avancement

Fiche maîtresse du chantier. À relire à chaque reprise (protocole de reprise de
CLAUDE.md) avec docs/ETAT.md et la fiche de la tâche en cours.

- Décision : [ADR 0018](../decisions/0018-audit-centralise-middleware.md) (accepté le
  2026-11-13 après la preuve docs/spikes/0002)
- Branche : une par étape, depuis develop (`refactor/audit-centralise` pour 0 et 1)
- Classement des routes : api/audits/declaration.py (déclarées) et
  api/audits/exclusions.py (à traiter par étape, exclues), vérifié par
  backend/tests/test_audit_coverage.py
- Inventaire des routes : [AUDC-routes.md](AUDC-routes.md), généré par
  `cd backend && .venv/bin/python -m scripts.audit_routes` (125 routes au 2026-11-13 :
  34 en étape 2, 42 en étape 3, 49 en étape 4)
- Plan validé par l'utilisateur le 2026-11-13

## Décisions de l'utilisateur (2026-11-13)

1. Le middleware fait tout le travail d'audit ; les repos n'écrivent plus l'audit.
2. L'audit est garanti par une transaction par requête (pas d'écriture après coup).
3. Toutes les routes qui modifient sont couvertes, par étapes ; aucune exclusion
   implicite : chaque route exclue l'est avec sa raison, validée par l'utilisateur.
4. Chaque étape est fusionnée séparément dans develop.
5. Un rollback() de repo annule toute la requête, même si la route avale l'erreur ;
   les routes à échec partiel toléré sont recensées (AUDC-14) et adaptées.
6. Après AUDC-14 : auth hors transaction de requête ; génération préventive tout ou
   rien ; achats en masse : valider puis écrire ; fermeture d'intervention tout ou rien
   avec sa cascade (ADR 0018 point 1 quinquies).
7. Décisions du 2026-11-14, après l'essai à l'écran de l'étape 1 (suppression de
   L014-PRE-20260616-QC : demande DI-2026-0167 restée « acceptée » vers une intervention
   supprimée, défaut antérieur à l'étape 1) :
   - une intervention vient toujours d'une demande : `POST /interventions` exigera une
     demande (changement d'API accepté, ADR à rédiger à l'étape 2) ;
   - supprimer une intervention oblige à choisir, dans la fenêtre de suppression, entre
     deux issues, chacune tout ou rien dans la transaction de requête et avec son motif :
     a) supprimer l'intervention et rouvrir sa demande (retour à « nouvelle », lien
     retiré, événement d'audit sur la demande) ; b) supprimer l'intervention et sa
     demande en cascade (ligne `deleted` pour chacune). Les règles actuelles restent :
     pas de suppression d'une intervention qui a des actions ou des achats liés ;
   - les interventions sans demande (198 en base de dev le 2026-11-14) sont l'histoire
     d'avant la séparation intervention / demande : on n'y touche pas, pas de contrainte
     en base qui les refuserait ;
   - motif system générique SYSTEM_CASCADE pour les mutations du système (AUDC-28) ;
     les deux POST sans écriture exclus « sans écriture » ; ordre : AUDC-22 et AUDC-23
     d'abord (accord du 2026-11-14) ;
   - après AUDC-22 (2026-11-14) : decision_type des demandes acceptés (transition :
     `statut_changed` seul, fin du doublon `status_transitioned`) ; demande liée à une
     occurrence préventive : pas de suppression en cascade (réouverture seulement), et la
     réouverture remet l'occurrence à « generated » ; ligne `created` pour l'intervention
     créée à l'acceptation d'une demande ; /repair déclaré `events_only` (AUDC-22b) ;
   - DI-2026-0167 réparée en base de dev avec l'accord de l'utilisateur (statut
     « nouvelle », lien retiré, ligne d'historique, ligne d'audit OTHER).

## Règles du chantier

- Chaque tâche commence par des tests qui échouent (xfail strict), finit par le contrôle
  de l'agent principal, une relecture, la mise à jour de cette fiche, de ETAT.md et de
  l'inventaire (script relancé).
- Un seul agent à la fois lance scripts/test-integration.sh (conteneur au nom fixe).
- Toute migration ou écriture en base de dev est soumise à l'accord de l'utilisateur.
- Avant de changer le contenu de l'historique d'audit (decision_type), montrer les
  différences à l'utilisateur.

## Étapes

| Étape | Contenu | Statut |
| --- | --- | --- |
| 0 | Preuve technique : connexion de requête par ContextVar jusqu'à la route (threadpool), commit différé, annulation sur échec de la route ou de l'audit | faite (ADR 0018 accepté) |
| 1 | Socle : middleware après JWT et RBAC ; transaction par requête ; déclaration d'audit par route et test de couverture (liste d'exceptions qui doit se vider) ; événements d'audit déposés par les repos ; créations, suppressions, POST de sous-ressource, plus de réécriture du corps (test de l'import CSV) | fusionnée dans develop le 2026-11-14 |
| 2 | Métier (34 routes) : interventions, demandes, actions, tâches, journal de statut, demandes d'achat, commandes, équipements, occurrences préventives (génération et acceptation automatique en mutations système) ; repos sans écriture d'audit ; fronts (motif à la suppression, motifs codés en dur retirés, auditGuard complété) ; intervention toujours issue d'une demande, suppression avec choix réouverture ou cascade de la demande (décision 7) | fusionnée dans develop le 2026-11-14 |
| 3 | Plans préventifs, pièces, gabarits, stock, fournisseurs, lignes de commande (42 routes) | à faire |
| 4 | Référentiels, admin (dont motifs et règles d'audit), clés d'API, utilisateurs, accueil, notifications, auth (49 routes, exclusions éventuelles à proposer une par une) | à faire |
| ensuite | Chantier « changements hors travail normal » (docs/ETAT.md) | à faire |

## Tâches

| Statut | Tâche | Agent | Dépend de |
| --- | --- | --- | --- |
| faite | [AUDC-00 Preuve technique](AUDC-00-preuve-transaction-par-requete.md) | backend-dev | ADR 0018 |
| faite | [AUDC-10 Tests qui échouent du socle](AUDC-10-tests-socle.md) | test-writer | ADR 0018 |
| faite | [AUDC-11 Transaction par requête, ordre des middlewares](AUDC-11-transaction-par-requete.md) | backend-dev | AUDC-10 |
| faite | [AUDC-15 Garde-fous avant fusion de l'étape 1](AUDC-15-garde-fous-avant-fusion.md) | backend-dev | AUDC-11 |
| faite | [AUDC-12 Déclaration d'audit et couverture](AUDC-12-declaration-et-couverture.md) | backend-dev | AUDC-11 |
| faite | [AUDC-13 Middleware d'audit sur le socle](AUDC-13-middleware-audit.md) | backend-dev | AUDC-11, AUDC-12 |
| faite | [AUDC-14 Recensement des échecs partiels](AUDC-14-recensement-echecs-partiels.md) | Explore | ADR 0018 |
| faite | [AUDC-20 ADR 0019, intervention issue d'une demande](../decisions/0019-intervention-issue-d-une-demande.md) | principal | décision 7 |
| faite | [AUDC-21 Tests qui échouent de l'étape 2](AUDC-21-tests-etape-2.md) | test-writer | ADR 0019 |
| faite | [AUDC-22 Interventions et demandes](AUDC-22-interventions-et-demandes.md) | backend-dev | AUDC-21, AUDC-28 |
| faite | [AUDC-23 Tâches, actions, journal de statut](AUDC-23-taches-actions-journal.md) | backend-dev | AUDC-21 |
| faite | [AUDC-22b Suites d'AUDC-22](AUDC-22b-suites-interventions-demandes.md) | backend-dev | AUDC-22, AUDC-23 |
| faite | [AUDC-22c Trace de l'acceptation à la création](AUDC-22c-trace-liaison-demande.md) | principal | AUDC-22 |
| faite | [AUDC-29 Règle d'audit de l'occurrence](AUDC-29-regle-audit-occurrence.md) | db-dev | AUDC-24 |
| faite | [AUDC-30 Motifs de suppression](AUDC-30-motifs-de-suppression.md) | db-dev | accord du 2026-11-14 |
| faite | [AUDC-24 Occurrences préventives](AUDC-24-preventif.md) | backend-dev | AUDC-28 |
| faite | [AUDC-25 Achats, commandes, équipements](AUDC-25-achats-commandes-equipements.md) | backend-dev | |
| faite | [AUDC-26 Fin du transitoire](AUDC-26-fin-du-transitoire.md) | backend-dev | AUDC-22 à 25 |
| faite | [AUDC-27a Front web](AUDC-27a-front-web.md) | frontend-dev | AUDC-22 à 30 |
| faite | [AUDC-27b Front mobile](AUDC-27b-front-mobile.md) | frontend-dev | AUDC-22 à 30 |
| faite | [AUDC-28 Motif system](AUDC-28-motif-system.md) | db-dev | accord du 2026-11-14 |

## Constats de départ (état des lieux du 2026-11-13)

Vérifiés par l'agent principal : AuditMiddleware s'exécute avant JWTMiddleware
(app.py:220-223) ; DELETE sans validation du motif ni audit sans motif dans le corps
(middleware.py:133, 240) ; créations non auditées par le middleware ; bruit des POST de
sous-ressource (lignes code_changed, description_changed, is_system_changed sur des
demandes en base de dev). Probable, à tester : import CSV des demandes d'achat cassé par
la réécriture du corps. Relevés par l'état des lieux, non revérifiés : routes non
mappées sans audit, mutations système sans trace, motifs codés en dur (repos et fronts),
auditGuard sans supplier-orders ni equipements, clé d'API sans user_id (audit manuel
impossible), appel web mort PATCH /intervention-requests/{id}/amelioration.

## Prochaine action

Étape 2 fusionnée dans develop le 2026-11-14 (essai web validé par l'utilisateur ; essai
mobile reporté : docs/backlog/websocket-hmr-proxy-dev.md). Suites :
docs/backlog/suites-audc-etape-2.md. Prochaine étape : 3 (plans préventifs, pièces,
gabarits, stock, fournisseurs, lignes de commande), plan court à proposer.
