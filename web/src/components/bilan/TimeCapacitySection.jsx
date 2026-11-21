/**
 * @fileoverview Section « Temps et capacité » de l'onglet État du service : répartition du temps,
 * causes de fragmentation, consommation par site, règles de lecture, alerte critique
 * @module components/bilan/TimeCapacitySection
 */

import PropTypes from 'prop-types';
import { TimeBreakdownSection } from '@/components/service-status/ServiceStatusComponents';
import { DecisionGuide, CriticalAlert } from '@/components/service-status/ServiceStatusDetails';
import FragmentationCausesList from '@/components/service-status/FragmentationCausesList';
import SiteConsumptionTable from '@/components/service-status/SiteConsumptionTable';

// Arrondi à 2 décimales pour l'affichage
const round = (value) => Number((value ?? 0).toFixed(2));

export default function TimeCapacitySection({ data }) {
  const timeBreakdown = Object.fromEntries(
    Object.entries(data.timeBreakdown).map(([key, value]) => [key, round(value)])
  );
  return (
    <>
      <TimeBreakdownSection timeBreakdown={timeBreakdown} totalHours={round(data.totalHours)} />
      <FragmentationCausesList fragmentation={data.fragmentation} />
      <SiteConsumptionTable siteConsumption={data.siteConsumption} />
      <DecisionGuide />
      <CriticalAlert
        chargePercent={data.chargePercent}
        fragPercent={data.fragPercent}
        pilotPercent={data.pilotPercent}
      />
    </>
  );
}
TimeCapacitySection.propTypes = { data: PropTypes.object.isRequired };
