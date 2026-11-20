# 0029. Audit des cascades

- Statut : accepté (2026-11-20, accord de l'utilisateur sur la porte de clôture de la
  demande, le champ des transitions permises et la migration)
- Date : 2026-11-20
- Affine : ADR 0005 (identité), 0018 (audit centralisé), 0027 (une seule porte de
  clôture), CLAUDE.md 2.4

## Contexte

Vérification du 2026-11-20 (base de dev en lecture seule, revue du code) : les décisions
prises par une route sont tracées (créations, statuts d'intervention, tâches faites ou
ignorées : 100 % depuis le 2026-11-14). Les écritures en cascade ne le sont pas :

1. Clôturer une demande « acceptée » (`POST /intervention-requests/{id}/transition`) ferme
   son intervention par un `UPDATE` brut : sans contrôle des tâches obligatoires, sans
   motif, sans événement sur l'intervention. C'est une deuxième porte de clôture, contraire
   à l'ADR 0027, ouverte à tout client de l'API (le mobile la propose, le web la cache).
2. L'occurrence préventive passe à « completed » ou « in_progress » sans trace (code et
   trigger `fn_sync_status_log_to_intervention`).
3. `closed_by` d'une tâche reste vide quand une action la clôt (7 sur 20).
4. Les journaux de statut n'ont pas d'auteur quand un trigger les écrit (intervention 25
   sur 27, demande 25 sur 31) ; le journal des demandes a 153 lignes en double, écrites par
   `fn_sync_status_log_to_intervention` (une par `fn_log_request_status_change`, une
   explicite).
5. Les routes `/repair`, l'affectation des tâches à l'acceptation d'une demande
   préventive, le regroupement des demandes d'achat en lignes de commande et le
   rattachement des sous-équipements écrivent sans événement.
6. Chaque front recopie sa propre liste des transitions de demande, et les copies
   divergent de l'API.

## Décision

1. **Une demande ne ferme plus son intervention.** La transition vers « clôturée » n'est
   permise que si la demande n'a pas d'intervention ou si son intervention est déjà
   fermée ; sinon 400 « Clore l'intervention : elle clôturera la demande ». La fermeture
   brute de l'intervention par la demande est supprimée. La seule porte reste
   `PUT /interventions/{id}` (ADR 0027).
2. **L'API dit ce qui est permis.** Chaque demande renvoyée (liste et détail) porte
   `allowed_transitions`, calculé par le backend d'après le statut, l'intervention liée et
   les droits de l'utilisateur. Un front n'affiche jamais une transition absente de cette
   liste ; il peut en présenter une partie (le web garde l'acceptation par la création
   d'une intervention). Les copies des fronts sont supprimées. Le backend continue de
   vérifier chaque transition reçue.
3. **L'auteur arrive jusqu'aux triggers.** La transaction de requête (ADR 0018) pose
   `app.user_id` (réglage local à la transaction) dès qu'un utilisateur est connu. Les
   triggers qui écrivent un journal le lisent : `request_status_log.changed_by` et une
   nouvelle colonne `intervention_status_log.changed_by`. `technician_id` reste une donnée
   déclarative (ADR 0005), il n'est pas réutilisé comme auteur. Hors requête (tâche
   planifiée, migration), le réglage est absent et l'auteur reste vide, comme aujourd'hui.
4. **Plus de doublon dans le journal des demandes.** Un trigger qui change le statut d'une
   demande et écrit lui-même sa ligne de journal fait taire
   `fn_log_request_status_change` le temps de son `UPDATE`, comme le code le fait déjà
   (`skip_request_status_log`).
5. **Chaque cascade dépose un événement du système** (`is_system`, `SYSTEM_CASCADE`, auteur
   = utilisateur de la requête) sur l'entité qu'elle modifie : occurrence préventive
   (completed, in_progress), corrections des routes `/repair`, tâches affectées ou datées à
   l'acceptation, lignes de commande créées ou cumulées au regroupement, sous-équipements
   rattachés. Une cascade du système ne reprend pas le motif de la décision qui l'a
   déclenchée.
6. **`closed_by` est rempli à chaque clôture de tâche**, quelle que soit la voie (route
   des tâches, action qui clôt la tâche), avec l'utilisateur de la requête.
7. **Un test de garde** déclenche chaque cascade connue et échoue si elle n'a pas déposé
   son événement.
8. **Rien n'est réécrit dans le passé** : un auteur ne s'invente pas après coup ; les
   doublons existants restent, ils ne se multiplient plus.

Hors périmètre : données recalculées depuis des données tracées (heures machine,
suggestions de préventif, totaux de commande).

## Alternatives écartées

- Garder la fermeture de l'intervention par la demande en y ajoutant contrôles et
  événement : deux portes à garder alignées, raison de l'ADR 0027.
- Faire écrire les journaux par le code et supprimer les triggers : réécriture large de
  chemins éprouvés en production ; le réglage `app.user_id` couvre tous les chemins, y
  compris ceux qu'on ne connaît pas encore.
- Réutiliser `technician_id` comme auteur : donnée « au nom de », falsifiable (ADR 0005).
- Laisser chaque front tenir sa liste de transitions : règle métier dupliquée qui dérive
  (constat 6).
- Rattraper les auteurs passés depuis audit_log : rapprochement incertain, trace inventée.

## Conséquences

- Migration 0022 (colonne `intervention_status_log.changed_by`, triggers) et champ
  `allowed_transitions` (API publique) acceptés par l'utilisateur le 2026-11-20.
- Le mobile ne propose plus « Clôturer » sur une demande dont l'intervention est ouverte.
- Production : 0022 à jouer à sa mise à jour, avec 0006 à 0021.
