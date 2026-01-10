/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 ServiceStatus.jsx - État du service : charge, fragmentation, capacité
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Outil d'aide à la décision au niveau service (pas machine).
 * Évalue charge ETP, fragmentation et capacité de pilotage.
 * 
 * Objectif : Répondre en < 30s à "Le service est-il en capacité de tenir et progresser ?"
 * 
 * Structure :
 * - En-tête : Titre + sélecteur de période
 * - Vue synthèse : 3 KPICards (Charge, Fragmentation, Pilotage)
 * - Répartition du temps : DistributionCards (PROD, DEP, PILOT, FRAG)
 * - Fragmentation : Indicateur actions courtes
 * - Lecture décisionnelle : Bloc texte règles factuelles
 * 
 * Contraintes :
 * - Aucun drill-down vers machines/interventions/techniciens
 * - Uniquement affichage + agrégation simple (pas de logique métier complexe)
 * - Composants communs réutilisés (KPICard, DistributionCards)
 * - Style sobre, orienté décision
 * 
 * @module pages/ServiceStatus
 * @requires hooks/useApiCall - Chargement API avec états
 * @requires components/service/ServiceStatusComponents - Composants présentation
 */

import { useState } from 'react';
import { Container } from '@radix-ui/themes';

// Custom Components
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';
import FragmentationCausesList from '@/components/service/FragmentationCausesList';
import SiteConsumptionTable from '@/components/service/SiteConsumptionTable';
import { 
  SynthesisCards, 
  TimeBreakdownSection,
  THRESHOLDS
} from '@/components/service/ServiceStatusComponents';
import {
  DecisionGuide,
  CriticalAlert
} from '@/components/service/ServiceStatusDetails';

// Custom Hooks
import { useServiceData } from '@/hooks/useServiceData';

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
 * Calcule les métriques dérivées du service
 */
const calculateMetrics = (serviceData) => {
  const { chargePercent, timeBreakdown, totalHours } = serviceData;
  
  const fragPercent = totalHours > 0 ? (timeBreakdown.FRAG / totalHours) * 100 : 0;
  const pilotPercent = totalHours > 0 ? (timeBreakdown.PILOT / totalHours) * 100 : 0;

  return {
    fragPercent,
    pilotPercent,
    chargeColor: getChargeColor(chargePercent),
    fragColor: getFragmentationColor(fragPercent),
    pilotColor: getPilotageColor(pilotPercent),
    chargeText: getChargeInterpretation(chargePercent),
    fragText: getFragmentationInterpretation(fragPercent),
    pilotText: getPilotageInterpretation(pilotPercent)
  };
};

/**
 * Page État du service
 */
export default function ServiceStatus() {
  // État local
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 3 mois par défaut
  const [endDate, setEndDate] = useState(new Date());

  // Handler changement de période
  const handleDateRangeChange = ({ range }) => {
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
    } else {
      // "Toutes" - on prend une plage large
      setStartDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 an
      setEndDate(new Date());
    }
  };

  // Chargement données via le hook useServiceData
  const { 
    data: serviceData, 
    loading, 
    error 
  } = useServiceData(startDate, endDate);

  // Gestion des états de chargement et erreur
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  if (!serviceData) {
    return null;
  }

  // Extraction données
  const { chargePercent, timeBreakdown } = serviceData;
  // Arrondis et formats
  const roundedTimeBreakdown = Object.fromEntries(
    Object.entries(timeBreakdown).map(([key, value]) => [key, Number((value ?? 0).toFixed(2))])
  );
  const roundedTotalHours = Number((serviceData.totalHours ?? 0).toFixed(2));
  
  // Calculs métriques
  const metrics = calculateMetrics(serviceData);
  const { 
    fragPercent, 
    pilotPercent, 
    chargeColor, 
    fragColor, 
    pilotColor,
    chargeText, 
    fragText, 
    pilotText 
  } = metrics;

  return (
    <Container size="4">
      <PageHeader 
        title="État du service"
        subtitle="Charge, fragmentation, capacité réelle"
        timeSelection={{
          enabled: true,
          mode: 'popover',
          component: 'daterange',
          onFilterChange: handleDateRangeChange
        }}
      />

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
      <TimeBreakdownSection timeBreakdown={roundedTimeBreakdown} totalHours={roundedTotalHours} />

      {/* Causes de fragmentation - Top 10 */}
      <FragmentationCausesList 
        fragmentation={serviceData.fragmentation}
      />

      {/* Consommation de capacité par site */}
      <SiteConsumptionTable 
        siteConsumption={serviceData.siteConsumption}
      />

      {/* Lecture décisionnelle */}
      <DecisionGuide />

      {/* Alerte si situation critique */}
      <CriticalAlert 
        chargePercent={chargePercent}
        fragPercent={fragPercent}
        pilotPercent={pilotPercent}
      />
    </Container>
  );
}
