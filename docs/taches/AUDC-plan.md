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
   - supprimer une intervention rouvre sa demande (retour à « nouvelle », lien retiré,
     événement d'audit sur la demande) dans la même transaction ; l'UI propose cette
     suppression en cascade (annonce ce qui arrive à la demande) ;
   - les interventions sans demande (198 en base de dev le 2026-11-14) sont l'histoire
     d'avant la séparation intervention / demande : on n'y touche pas, pas de contrainte
     en base qui les refuserait ;
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
| 2 | Métier (34 routes) : interventions, demandes, actions, tâches, journal de statut, demandes d'achat, commandes, équipements, occurrences préventives (génération et acceptation automatique en mutations système) ; repos sans écriture d'audit ; fronts (motif à la suppression, motifs codés en dur retirés, auditGuard complété) ; intervention toujours issue d'une demande, suppression qui rouvre la demande (décision 7) | à faire |
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

Étape 1 fusionnée dans develop le 2026-11-14 après l'essai à l'écran de l'utilisateur
(fenêtre de motif et rejeu de la suppression validés). Étape 2 : ouvrir sa branche, écrire
l'ADR « intervention toujours issue d'une demande » et les fiches ; retirer les deux
exclusions temporaires de api/transaction.py et le default_factory transitoire des 9
schémas (reason_code).
