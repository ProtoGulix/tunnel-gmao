# 0016. Clôture des tâches en réunion de coordination

- Statut : accepté
- Date : 2026-11-13
- Affine : CLAUDE.md section 2 (l'action est l'unité de travail réel), ADR 0015

Réécrit le 2026-11-13 avant toute fusion : la première version imposait le motif OTHER
et un texte obligatoire codés en dur, en contournant le système de motifs d'audit.

## Contexte

En réunion de coordination, le responsable passe en revue les interventions ouvertes
et veut solder celles dont le travail est fait ou abandonné. Une tâche ne passait
« Terminé » qu'en la liant à une action (`InterventionTaskPatch` n'acceptait que
`todo` et `skipped`) ; sur une intervention préventive, le déclencheur
`check_intervention_closable` refuse la clôture tant qu'une tâche obligatoire est à
faire ou en cours.

Tunnel a déjà un système de motifs d'audit : les motifs (`audit_reason_code`) et les
règles (`audit_rule`) se gèrent dans l'administration ; quand une mutation n'est pas
routinière, le backend répond « reason_code obligatoire » avec la liste des motifs de
l'entité, et le front ouvre `AuditReasonDialog` puis rejoue la requête. Le changement de
statut d'une tâche est routinier (`task.status`, motif ROUTINE) : c'est vrai pour le
travail normal, où l'action clôt la tâche, pas pour une décision prise en réunion.

## Décision

1. RESP et ADMIN peuvent passer une tâche en `done` par `PATCH /intervention-tasks/{id}`,
   sans action liée. Les autres rôles reçoivent 403.
2. Un changement de statut direct vers `done` ou `skipped` (PATCH, sans action) n'est
   jamais routinier : sans motif explicite (absent ou de catégorie auto ou system, comme
   ROUTINE), le backend répond la demande de motif standard. Seuls sont proposés et
   acceptés les motifs actifs de l'entité task dont la colonne existante
   `decision_types` contient `task_done` (pour Terminé) ou `task_skipped` (pour Annuler
   et Ignorer) : la liste se règle dans l'administration, sans code. Le front n'impose
   aucun motif : la fenêtre d'audit existante les propose.
3. Le texte libre suit la règle générale : exigé seulement pour le motif OTHER.
4. Quatre motifs de catégorie user, entité task, sont ajoutés aux données de référence
   et à la base en service : TASK_DONE_UNRECORDED (réalisée sans action saisie),
   TASK_HANDLED_ELSEWHERE (traitée dans une autre intervention), TASK_NO_LONGER_NEEDED
   (plus nécessaire), TASK_DUPLICATE (doublon). Terminé propose TASK_DONE_UNRECORDED,
   TASK_HANDLED_ELSEWHERE et OTHER ; Annuler et Ignorer proposent TASK_NO_LONGER_NEEDED,
   TASK_DUPLICATE, TASK_HANDLED_ELSEWHERE et OTHER. LEGACY_STATUS_CHANGE (journaux
   migrés, sans entité, donc proposé partout) est désactivé ; l'historique qui le
   référence reste lisible.
5. « Annuler » est le statut existant `skipped` (Ignoré). Pour un `skipped` direct avec
   motif explicite, `skip_reason` peut être omis : il prend le libellé du motif (et le
   texte s'il y en a un). La règle de l'étape obligatoire de gamme réservée à RESP et
   ADMIN ne change pas.
6. Le front web propose « Terminé » et « Annuler » sur chaque ligne de tâche, dans
   l'onglet Tâches et la page Coordination, aux seuls RESP et ADMIN ; ils envoient le
   seul changement de statut. Le backend fait foi.

## Alternatives écartées

- Motif OTHER et texte obligatoire codés en dur (première version) : contourne les
  motifs configurés par l'entreprise et la fenêtre d'audit commune.
- Colonne ou marque « clôturée en coordination » : l'audit porte déjà auteur, date et
  motif ; une colonne dupliquerait la trace.
- Action fictive créée au clic : enregistre un travail qui n'a pas eu lieu, contraire
  au principe 4 (traçabilité fiable).
- Nouveau statut « Annulé » : migration et impact sur tous les compteurs, sans
  différence d'usage avec Ignoré.
- Rendre la règle `task.status` non routinière dans l'administration : toucherait aussi
  les changements de statut du travail normal.
- Proposer tous les motifs de l'entité task : la fenêtre listait treize motifs, dont
  ceux de planning et de priorité, sans rapport avec une clôture.
- Une seule liste pour Terminé et Annuler (decision_types = status_changed) : propose
  « Doublon » pour Terminé et « Réalisée sans action » pour Annuler.

## Conséquences

- Une tâche `done` n'a plus forcément d'action liée ; une tâche close en réunion
  n'ajoute aucun temps.
- Le bouton « Ignorer » existant passe lui aussi par le choix de motif.
- Les motifs du point 4 sont dans la seed (installations neuves) et ont été insérés à
  la main dans la base en service le 2026-11-13, avec l'accord de l'utilisateur ; une
  autre installation existante ne les aura que par l'administration ou une migration.
