/**
 * Tab État du Service
 * 
 * Chef d'orchestre de la page État du Service.
 * Affiche charge, fragmentation et capacité de pilotage avec toutes les sections détaillées.
 * 
 * @module components/service-status/tabs/ServiceStatusTab
 */

import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';

import { useServiceData } from '@/hooks/service-status/useServiceData';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

import {
  SynthesisCards,
  TimeBreakdownSection
} from '@/components/service-status/ServiceStatusComponents';
import { THRESHOLDS } from '@/components/service-status/config';
import {
  DecisionGuide,
  CriticalAlert
} from '@/components/service-status/ServiceStatusDetails';
import FragmentationCausesList from '@/components/service-status/FragmentationCausesList';
import SiteConsumptionTable from '@/components/service-status/SiteConsumptionTable';

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
const calculateMetrics = (serviceData) => {
  const { chargePercent, fragPercent, pilotPercent, statuses = {} } = serviceData;

  return {
    ...extractColors(chargePercent, fragPercent, pilotPercent, statuses),
    ...extractTexts(chargePercent, fragPercent, pilotPercent, statuses),
  };
};

/**
 * Tab État du Service
 */
export default function ServiceStatusTab({ startDate, endDate }) {
  const { data, loading, error } = useServiceData(startDate, endDate);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <LoadingState message="Aucune donnée disponible" />;

  const {
    chargePercent,
    fragPercent,
    pilotPercent,
    timeBreakdown,
    totalHours,
    fragmentation,
    siteConsumption,
  } = data;

  // Arrondis pour l'affichage
  const roundedTimeBreakdown = Object.fromEntries(
    Object.entries(timeBreakdown).map(([key, value]) => [key, Number((value ?? 0).toFixed(2))])
  );
  const roundedTotalHours = Number((totalHours ?? 0).toFixed(2));

  // Calculs métriques
  const metrics = calculateMetrics(data);
  const {
    chargeColor,
    fragColor,
    pilotColor,
    chargeText,
    fragText,
    pilotText
  } = metrics;

  return (
    <Box>
      {/* Vue synthèse - Cards KPI */}
      <SynthesisCards
        chargePercent={chargePercent}
        chargeText={chargeText}
        chargeColor={chargeColor}
        fragPercent={fragPercent}
        fragText={fragText}
        fragColor={fragColor}
        pilotPercent={pilotPercent}
        pilotText={pilotText}
        pilotColor={pilotColor}
      />

      {/* Répartition du temps */}
      <TimeBreakdownSection 
        timeBreakdown={roundedTimeBreakdown} 
        totalHours={roundedTotalHours} 
      />

      {/* Causes de fragmentation - Top 10 */}
      <FragmentationCausesList 
        fragmentation={fragmentation}
      />

      {/* Consommation de capacité par site */}
      <SiteConsumptionTable 
        siteConsumption={siteConsumption}
      />

      {/* Lecture décisionnelle */}
      <DecisionGuide />

      {/* Alerte si situation critique */}
      <CriticalAlert 
        chargePercent={chargePercent}
        fragPercent={fragPercent}
        pilotPercent={pilotPercent}
      />
    </Box>
  );
}

ServiceStatusTab.propTypes = {
  startDate: PropTypes.instanceOf(Date).isRequired,
  endDate: PropTypes.instanceOf(Date).isRequired,
};

