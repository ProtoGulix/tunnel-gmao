/**
 * @fileoverview Couleurs et textes de lecture de la charge, de la fragmentation et du pilotage
 * (seuils de config.js ; le statut renvoyé par l'API prime quand il existe)
 * @module components/service-status/serviceMetrics
 */

import { THRESHOLDS } from '@/components/service-status/config';


/**
 * Détermine la couleur de la charge
 */
const getChargeColor = (chargePercent) => {
  if (chargePercent < THRESHOLDS.CHARGE.NORMAL) return 'green';
  if (chargePercent < THRESHOLDS.CHARGE.HIGH) return 'orange';
  return 'red';
};

/**
 * Détermine la couleur de la fragmentation
 */
const getFragmentationColor = (fragPercent) => {
  if (fragPercent < THRESHOLDS.FRAGMENTATION.LOW) return 'green';
  if (fragPercent < THRESHOLDS.FRAGMENTATION.MEDIUM) return 'orange';
  return 'red';
};

/**
 * Détermine la couleur du pilotage
 */
const getPilotageColor = (pilotPercent) => {
  if (pilotPercent > THRESHOLDS.PILOTAGE.LOW) return 'green';
  if (pilotPercent > THRESHOLDS.PILOTAGE.CRITICAL) return 'orange';
  return 'red';
};

/**
 * Génère le texte de lecture pour la fragmentation
 */
const getFragmentationInterpretation = (fragPercent) => {
  if (fragPercent > THRESHOLDS.FRAGMENTATION.MEDIUM) {
    return 'Fragmentation élevée : service morcelé';
  }
  return 'Fragmentation maîtrisée';
};

/**
 * Génère le texte de lecture pour la charge
 */
const getChargeInterpretation = (chargePercent) => {
  if (chargePercent > THRESHOLDS.CHARGE.HIGH) {
    return 'Service au plafond';
  }
  if (chargePercent > THRESHOLDS.CHARGE.NORMAL) {
    return 'Charge élevée';
  }
  return 'Charge normale';
};

/**
 * Génère le texte de lecture pour le pilotage
 */
const getPilotageInterpretation = (pilotPercent) => {
  if (pilotPercent < THRESHOLDS.PILOTAGE.CRITICAL) {
    return 'Aucune capacité d\'amélioration';
  }
  if (pilotPercent < THRESHOLDS.PILOTAGE.LOW) {
    return 'Capacité d\'amélioration limitée';
  }
  return 'Capacité d\'amélioration présente';
};

/**
 * Extrait les couleurs des statuts ou utilise les valeurs par défaut
 */
const extractColors = (chargePercent, fragPercent, pilotPercent, statuses) => ({
  chargeColor: statuses.charge?.color || getChargeColor(chargePercent),
  fragColor: statuses.frag?.color || getFragmentationColor(fragPercent),
  pilotColor: statuses.pilot?.color || getPilotageColor(pilotPercent),
});

/**
 * Extrait les textes des statuts ou utilise les valeurs par défaut
 */
const extractTexts = (chargePercent, fragPercent, pilotPercent, statuses) => ({
  chargeText: statuses.charge?.text || getChargeInterpretation(chargePercent),
  fragText: statuses.frag?.text || getFragmentationInterpretation(fragPercent),
  pilotText: statuses.pilot?.text || getPilotageInterpretation(pilotPercent),
});

/**
 * Calcule les métriques dérivées du service
 */
export const calculateMetrics = (serviceData) => {
  const { chargePercent, fragPercent, pilotPercent, statuses = {} } = serviceData;

  return {
    ...extractColors(chargePercent, fragPercent, pilotPercent, statuses),
    ...extractTexts(chargePercent, fragPercent, pilotPercent, statuses),
  };
};
