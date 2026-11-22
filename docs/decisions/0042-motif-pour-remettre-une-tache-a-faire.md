# 0042. Remettre une tâche à faire exige un motif

- Statut : accepté (2026-11-22)
- Date : 2026-11-22
- Affine : ADR 0028 (réouverture d'une intervention avec motif), CLAUDE.md 2.4

## Contexte

Une tâche terminée ou annulée revient « à faire » par le PATCH de la tâche, sans motif : le
middleware d'audit pose le motif routinier ROUTINE. C'est pourtant un changement hors travail
normal (CLAUDE.md 2.4). Décisions de l'utilisateur du 2026-11-13, précisées le 2026-11-22.

## Décision

1. Remettre à faire une tâche terminée ou annulée exige un motif explicite, pour tous les rôles.
   Motifs de départ : « Clôturée par erreur » (TASK_CLOSED_BY_MISTAKE), « Travail à reprendre »
   (TASK_REWORK), et « Autre raison » (OTHER, avec texte). Ils portent la décision
   `task_reopened` et s'ajoutent aux données de référence par migration (0027).
2. Le journal enregistre une décision nommée `task_reopened` (« Tâche remise à faire »), et non
   un simple changement de statut.
3. À la remise à faire, l'auteur de la clôture (`closed_by`) est effacé.
4. Le retour automatique à faire, quand on supprime la dernière action d'une tâche en cours,
   reste sans motif : il découle d'une suppression déjà motivée.
5. Pas de nouveau motif de clôture « Oubli de clôture à la saisie » : « Réalisée sans action
   saisie » couvre le cas.

## Alternatives écartées

- Remise à faire réservée à RESP et ADMIN : le technicien qui s'est trompé doit pouvoir
  corriger lui-même, la correction restant tracée (terrain first).
- Motif porté par une ligne « statut modifié » : moins lisible dans le journal.
- Règle portée par la base (motif transmis par variable de session) : tous les autres motifs
  passent par le mécanisme d'audit de l'API ; un second mécanisme pour un seul cas.
