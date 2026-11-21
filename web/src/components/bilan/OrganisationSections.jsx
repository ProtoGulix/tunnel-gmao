/**
 * @fileoverview Sections « Organisation du travail » (valeurs par mois, repliées) et
 * « Préventif » (trois chiffres d'état) de l'onglet État du service (ADR 0021, 0033, 0034)
 * @module components/bilan/OrganisationSections
 */

import PropTypes from 'prop-types';
import { Text } from '@radix-ui/themes';
import SectionTitle from '@/components/bilan/SectionTitle';
import PreventiveFigures from '@/components/bilan/PreventiveFigures';
import InfoLabel from '@/components/ui/InfoLabel';
import { MonthlyTable } from '@/components/organisation/OrganisationFigures';
import { DEFINITIONS } from '@/components/organisation/definitions';

/**
 * @param {Object} data - réponse de /stats/organisation
 * @param {number|null} overdueCount - préventifs en retard ; null : chiffre omis
 */
export default function OrganisationSections({ data, overdueCount }) {
  const empty = data.totals.interventions_reported === 0 && data.totals.hours.total === 0;
  return (
    <>
      <SectionTitle>
        <InfoLabel label="Organisation du travail" definition={DEFINITIONS.date} size="4" weight="bold" />
      </SectionTitle>
      {empty ? (
        <Text size="2" color="gray">Aucune activité sur cette période.</Text>
      ) : (
        <MonthlyTable monthly={data.monthly} />
      )}
      <SectionTitle>Préventif</SectionTitle>
      <PreventiveFigures preventive={data.preventive} overdueCount={overdueCount} />
    </>
  );
}
OrganisationSections.propTypes = {
  data: PropTypes.object.isRequired,
  overdueCount: PropTypes.number,
};
