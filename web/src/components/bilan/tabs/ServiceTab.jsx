/**
 * @fileoverview Onglet « État du service » du Bilan : bandeau de chiffres clés, puis temps et
 * capacité, organisation du travail, préventif. Les deux sources (service-status et
 * organisation) sont chargées séparément : l'erreur de l'une n'empêche pas l'autre (ADR 0033).
 * @module components/bilan/tabs/ServiceTab
 */

import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import SectionTitle from '@/components/bilan/SectionTitle';
import ServiceKeyFigures from '@/components/bilan/ServiceKeyFigures';
import TimeCapacitySection from '@/components/bilan/TimeCapacitySection';
import OrganisationSections from '@/components/bilan/OrganisationSections';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { useServiceData } from '@/hooks/service-status/useServiceData';
import { useOrganisation } from '@/hooks/organisation/useOrganisation';
import { usePreventiveSchedule } from '@/hooks/preventive/usePreventiveSchedule';

// Un bloc : erreur, chargement ou contenu
function Block({ state, onRetry, children }) {
  if (state.error) return <ErrorState error={state.error} onRetry={onRetry} />;
  if (state.loading || !state.data) return <LoadingState fullscreen={false} message="Chargement…" />;
  return children(state.data);
}
Block.propTypes = { state: PropTypes.object.isRequired, onRetry: PropTypes.func, children: PropTypes.func.isRequired };

/**
 * @param {string} startDate - AAAA-MM-JJ
 * @param {string} endDate - AAAA-MM-JJ
 */
export default function ServiceTab({ startDate, endDate }) {
  const { can } = usePermissions();
  const canOrganisation = can(PERM.stats.organisation);
  const canSchedule = can(PERM.preventive.schedule);
  const service = useServiceData(startDate, endDate);
  const organisation = useOrganisation(startDate, canOrganisation);
  // Chiffre « Préventifs en retard » : sans appel si l'échéancier n'est pas lisible (un 403
  // afficherait une erreur globale) ; omis tant qu'il n'a pas répondu
  const overdue = usePreventiveSchedule({ state: 'overdue' }, canOrganisation && canSchedule);
  const overdueCount = !canSchedule || overdue.loading || overdue.error ? null : overdue.items.length;

  return (
    <Box>
      <ServiceKeyFigures service={service.data} organisation={organisation.data} showOrganisation={canOrganisation} />
      <SectionTitle>Temps et capacité</SectionTitle>
      <Block state={service} onRetry={service.refetch}>{(data) => <TimeCapacitySection data={data} hours={organisation.data?.totals?.hours ?? null} />}</Block>
      {canOrganisation && (
        <Block state={organisation} onRetry={organisation.reload}>
          {(data) => <OrganisationSections data={data} overdueCount={overdueCount} />}
        </Block>
      )}
    </Box>
  );
}
ServiceTab.propTypes = { startDate: PropTypes.string.isRequired, endDate: PropTypes.string.isRequired };
