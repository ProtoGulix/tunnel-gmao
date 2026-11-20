# 0025. Créer une intervention, sa demande et ses tâches en une seule transaction

- Statut : accepté (2026-11-20, décisions de l'utilisateur)
- Date : 2026-11-20
- Affine : ADR 0019 (une intervention vient toujours d'une demande)

## Contexte

Les fronts créent une intervention en plusieurs appels sans transaction commune :
`POST /intervention-requests`, puis `POST /interventions`, puis un `POST /intervention-tasks`
par tâche (fenêtre de création du web). Un échec au milieu laisse une demande orpheline au
statut « nouvelle », qui a déjà notifié les techniciens et envoyé le mail « à traiter » ;
un nouvel essai crée une deuxième demande, voire une deuxième intervention.

Constats du relevé du 2026-11-20 :

- le web envoie `origine: 'directe'`, que `InterventionRequestIn` ne connaît pas : la
  demande est enregistrée « signalee » et notifie, alors que le trigger
  `fn_notify_di_a_traiter` sait déjà ne rien notifier pour une demande « directe » ;
- l'INSERT de l'intervention est écrit deux fois (`InterventionRepository.add` et
  l'acceptation dans `InterventionRequestRepository.transition_status`), avec des règles
  différentes : statut initial, titre et technicien perdus à l'acceptation ;
- les trois formulaires du web diffèrent (demandeur, `reported_by`, tâches) et le mobile
  suit encore d'autres règles (création masquée si une intervention est ouverte).

Décisions de l'utilisateur du 2026-11-20 : le formulaire de création de l'accueil
(DayContextPanel, DayContextRightColumn) est la référence, seul comportement validé à
l'usage ; la page de création et la fenêtre de Coordination utilisent le même composant,
le mobile s'aligne dessus, sans tâches à la création (elles s'ajoutent ensuite). Un
premier choix, la fenêtre de Coordination comme référence, a été corrigé par
l'utilisateur à l'essai à l'écran le même jour ; une demande créée dans le même geste que son intervention ne notifie pas ; le
mobile permet toujours de créer une intervention ; le mobile propose de clore
l'intervention quand sa dernière tâche est close.

## Décision

1. `POST /interventions` reçoit, au choix et de façon exclusive : `request_id` (demande
   existante, règles de lien inchangées) ou `request` (contenu d'une nouvelle demande :
   demandeur, description, service). Ni l'un ni l'autre, ou les deux : 422. Il reçoit
   aussi une liste facultative `tasks`. Demande, intervention, lien, journal de statut de
   la demande et tâches sont écrits dans une seule transaction : un échec n'écrit rien.
   Ajout compatible : un appel actuel avec `request_id` seul garde son comportement.
   Changement d'API publique accepté par l'utilisateur le 2026-11-20.
2. Une demande créée par cette route a l'origine « directe » : ni notification ni mail.
3. Une seule fonction du backend insère une intervention ; l'acceptation d'une demande
   l'appelle aussi, avec le titre et le technicien reçus.
4. Le web n'a qu'un composant de création, celui de l'accueil : demande choisie ou
   saisie (demandeur, service, description, qui sert de titre), date de prise en charge,
   technicien pilote, type, priorité, pas de tâches. La fenêtre de création (ouverte
   depuis la liste des interventions et la Coordination) et le Briefing l'utilisent ;
   l'ancienne page de création est supprimée. Le mobile suit les mêmes règles. `tasks` reste accepté
   par l'API (création atomique), sans usage par les fronts pour l'instant.
5. Clore l'intervention depuis le mobile reste une décision explicite : il la propose
   après la clôture de la dernière tâche, avec la fenêtre de motif commune si les règles
   d'audit en exigent un (CLAUDE.md 2.4). Rien n'est clos sans confirmation.

## Alternatives écartées

- Garder les appels séparés et nettoyer côté front en cas d'échec (supprimer la demande
  créée) : la suppression peut échouer aussi, les notifications sont déjà parties, et
  chaque front devrait recoder ce nettoyage.
- Une route dédiée (`POST /interventions/with-request`) à côté de l'actuelle : deux façons
  de créer une intervention, exactement le défaut qu'on corrige.
- Clore automatiquement l'intervention avec sa dernière tâche : décision hors du travail
  normal prise sans le technicien, contraire à CLAUDE.md 2.4.

## Conséquences

- Plus de demande orpheline ni de doublon à la création ; les demandes « directes »
  cessent de notifier.
- Aucune migration : la colonne `origine` et le trigger existent déjà.
- `POST /intervention-tasks` reste pour ajouter une tâche plus tard.
- Les demandes orphelines déjà en base ne sont pas corrigées par ce chantier.
