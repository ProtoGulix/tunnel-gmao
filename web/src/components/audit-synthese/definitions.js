/**
 * @fileoverview Définitions affichées à côté de chaque indicateur de la synthèse de l'audit
 * (ADR 0032). Ton neutre : le partage des tâches est un fonctionnement normal, pas une faute.
 * @module components/audit-synthese/definitions
 */

export const DEFINITIONS = {
  roles:
    "Le garant est la personne affectée à la tâche : il est responsable de la finir. Les exécutants sont les techniciens qui ont saisi les actions liées à la tâche. Plusieurs exécutants, ou un garant qui n'exécute pas lui-même, sont des fonctionnements normaux.",
  withoutGuarantor:
    "Tâches créées dans le mois sans personne affectée. Part calculée sur les tâches créées.",
  doneWithoutGuarantorAction:
    "Tâches terminées dont le garant n'a saisi aucune action : le travail a été fait par d'autres. C'est un signe de travail d'équipe, pas une faute. Part calculée sur les tâches terminées qui ont un garant.",
  spottedInField:
    "Repéré sur le terrain : tâche créée par son garant, qui y a lui-même fait une action. Part calculée sur les tâches terminées qui ont un garant.",
  sharedTasks:
    "Tâches partagées : tâches terminées avec au moins deux exécutants différents, signe de travail d'équipe. Part calculée sur les tâches terminées.",
  decisions:
    "Décisions hors travail normal : choix faits avec un motif (clôture, réouverture, tâche annulée…), comptés par type de décision et par motif. Les modifications sans motif n'en font pas partie.",
  system:
    "Part des modifications faites automatiquement par le système (cascades, calculs) parmi tous les événements du journal du mois.",
  incomplete:
    "Données incomplètes : avant le 20 novembre 2026, l'auteur des clôtures et les modifications en cascade n'étaient pas toutes enregistrés. Les décisions et la part automatique de ces mois sont à lire avec prudence.",
};
