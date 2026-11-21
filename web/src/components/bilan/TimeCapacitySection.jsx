/**
 * @fileoverview Section « Temps et capacité » de l'onglet État du service : deux barres
 * empilées (catégories de travail, types d'intervention) et deux tableaux repliés (ADR 0034)
 * @module components/bilan/TimeCapacitySection
 */

import PropTypes from 'prop-types';
import { Box, Text } from '@radix-ui/themes';
import StackedBar from '@/components/bilan/StackedBar';
import FoldedSection from '@/components/bilan/FoldedSection';
import { typeColor } from '@/components/equipements/dashboardColors';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { SERVICE_TIME_TYPE_CATEGORIES, SERVICE_DEFINITIONS } from '@/components/service-status/config';
import FragmentationCausesList from '@/components/service-status/FragmentationCausesList';
import SiteConsumptionTable from '@/components/service-status/SiteConsumptionTable';

const HOUR_TYPES = [
  { key: 'CUR', label: 'Curatif', color: typeColor('CUR') },
  { key: 'PRE', label: 'Préventif', color: typeColor('PRE') },
  { key: 'PRO', label: 'Projet', color: typeColor('PRO') },
  { key: 'other', label: 'Autres', color: typeColor(null) },
];

// Catégories d'actions de chaque type de temps, pour l'infobulle de la barre
function categoriesHelp() {
  return (
    <Box>
      {Object.values(SERVICE_TIME_TYPE_CATEGORIES).map((type) => (
        <Text as="div" size="1" key={type.label}>
          <strong>{type.label}</strong> : {type.categories.map((c) => `${c.code} (${c.name})`).join(', ')}
        </Text>
      ))}
      <Text as="div" size="1">La fragmentation compte aussi les actions courtes (&lt; 0,5 h), sauf dépannage et préventif.</Text>
    </Box>
  );
}

function timeSegments(timeBreakdown) {
  return Object.entries(SERVICE_TIME_TYPE_CATEGORIES).map(([key, type]) => ({
    key, label: type.label, color: `var(--${type.color}-9)`, value: timeBreakdown?.[key] ?? 0,
  }));
}

/**
 * @param {Object} data - réponse de /stats/service-status
 * @param {Object|null} hours - heures par type d'intervention (totals.hours de /stats/organisation) ;
 *   null : droit absent ou pas de réponse, la barre est omise
 */
export default function TimeCapacitySection({ data, hours }) {
  return (
    <>
      <StackedBar
        title="Répartition du temps par catégorie de travail" definition={categoriesHelp()}
        segments={timeSegments(data.timeBreakdown)} total={data.totalHours ?? 0}
      />
      {hours && hours.total > 0 && (
        <StackedBar
          title="Heures par type d'intervention" definition={DEFINITIONS.hours}
          segments={HOUR_TYPES.map((t) => ({ ...t, value: hours[t.key] ?? 0 }))} total={hours.total}
        />
      )}
      <FoldedSection title="Causes de la fragmentation" definition={SERVICE_DEFINITIONS.fragmentationCauses}>
        <FragmentationCausesList fragmentation={data.fragmentation} />
      </FoldedSection>
      <FoldedSection title="Consommation de capacité par site" definition={SERVICE_DEFINITIONS.siteConsumption}>
        <SiteConsumptionTable siteConsumption={data.siteConsumption} />
      </FoldedSection>
    </>
  );
}
TimeCapacitySection.propTypes = {
  data: PropTypes.object.isRequired,
  hours: PropTypes.object,
};
