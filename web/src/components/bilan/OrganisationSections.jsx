/**
 * @fileoverview Sections « Organisation du travail » (courbes et valeurs par mois) et
 * « Préventif » (tuiles d'état) de l'onglet État du service (ADR 0021, 0033)
 * @module components/bilan/OrganisationSections
 */

import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Text } from '@radix-ui/themes';
import LoadingState from '@/components/ui/LoadingState';
import SectionTitle from '@/components/bilan/SectionTitle';
import { StateTiles, MonthlyTable } from '@/components/organisation/OrganisationFigures';
import { DEFINITIONS } from '@/components/organisation/definitions';

// Recharts n'est téléchargé qu'à l'affichage des graphiques (ADR 0020)
const Charts = lazy(() => import('@/components/organisation/OrganisationCharts'));

/**
 * @param {Object} data - réponse de /stats/organisation
 * @param {number|null} overdueCount - préventifs en retard ; null : tuile omise
 */
export default function OrganisationSections({ data, overdueCount }) {
  const empty = data.totals.interventions_reported === 0 && data.totals.hours.total === 0;
  return (
    <>
      <SectionTitle>Organisation du travail</SectionTitle>
      {empty ? (
        <Text size="2" color="gray">Aucune activité sur cette période.</Text>
      ) : (
        <>
          <Suspense fallback={<LoadingState fullscreen={false} message="Chargement des graphiques…" />}>
            <Charts monthly={data.monthly} />
          </Suspense>
          <MonthlyTable monthly={data.monthly} />
        </>
      )}
      <Text as="p" size="1" color="gray" mt="3">{DEFINITIONS.date}</Text>
      <SectionTitle>Préventif</SectionTitle>
      <StateTiles preventive={data.preventive} overdueCount={overdueCount} />
    </>
  );
}
OrganisationSections.propTypes = {
  data: PropTypes.object.isRequired,
  overdueCount: PropTypes.number,
};
