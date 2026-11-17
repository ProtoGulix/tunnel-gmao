/**
 * @fileoverview Définitions affichées sous chaque indicateur (reprises de l'ADR 0021).
 * Les modifier demande un nouvel ADR : les courbes doivent rester comparables dans le temps.
 * @module components/organisation/definitions
 */

export const DEFINITIONS = {
  interrupted:
    "Un chantier est un couple (technicien, intervention de projet ou de préventif) avec des actions sur au moins deux jours distincts, rattaché au mois de son premier jour. Il est coupé quand le même technicien traite, un jour strictement entre le premier et le dernier, une intervention curative urgente.",
  urgent:
    "Interventions de priorité urgente parmi celles signalées dans le mois.",
  hours:
    "Somme du temps passé sur les actions, par type d'intervention (curatif, préventif, projet, autres) et par mois de la date de l'action.",
  average:
    "Pour chaque journée d'un technicien, le nombre d'interventions distinctes sur lesquelles il a agi ; moyenne du mois.",
  scattered:
    "Part des journées de technicien où il a agi sur 3 interventions distinctes ou plus.",
  preventive:
    "État actuel : occurrences générées dont la demande liée est encore « nouvelle », avec l'âge de la plus ancienne.",
  generation:
    "Date de la dernière occurrence générée. La génération du préventif est manuelle : au-delà de 35 jours, un oubli est probable.",
  waitingParts:
    "État actuel : interventions au statut « attente de pièces », âge médian depuis leur signalement.",
  date:
    "La date d'une action est le jour du travail saisi par le technicien, à défaut la date de signalement de l'intervention.",
};
