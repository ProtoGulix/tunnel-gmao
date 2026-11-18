/**
 * @fileoverview Page Organisation : indicateurs d'organisation de l'équipe, vus par tous (ADR 0021).
 * Chiffres d'équipe uniquement, aucun détail par technicien.
 * @module pages/organisation/OrganisationPage
 */

import { lazy, Suspense, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Box, Container, Flex, Select, Text } from '@radix-ui/themes';
import { Users } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { StateTiles, PeriodFigures, MonthlyTable } from '@/components/organisation/OrganisationFigures';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { useOrganisation } from '@/hooks/organisation/useOrganisation';
import { usePreventiveSchedule } from '@/hooks/preventive/usePreventiveSchedule';
import { periodStartDate } from '@/hooks/equipements/dashboardFilters';

// Recharts n'est téléchargé qu'à l'affichage des graphiques (ADR 0020)
const Charts = lazy(() => import('@/components/organisation/OrganisationCharts'));

const PERIODS = [
  { value: '6', label: '6 mois' },
  { value: '12', label: '12 mois' },
  { value: '24', label: '24 mois' },
];

function Body({ data, overdueCount }) {
  const empty = data.totals.interventions_reported === 0 && data.totals.hours.total === 0;
  return (
    <>
      <StateTiles preventive={data.preventive} waitingParts={data.waiting_parts} overdueCount={overdueCount} />
      {empty ? (
        <Text size="2" color="gray">Aucune activité sur cette période.</Text>
      ) : (
        <>
          <PeriodFigures totals={data.totals} />
          <Suspense fallback={<LoadingState fullscreen={false} message="Chargement des graphiques…" />}>
            <Charts monthly={data.monthly} />
          </Suspense>
          <MonthlyTable monthly={data.monthly} />
        </>
      )}
      <Text as="p" size="1" color="gray" mt="4">{DEFINITIONS.date}</Text>
    </>
  );
}
Body.propTypes = { data: PropTypes.object.isRequired, overdueCount: PropTypes.number };

export default function OrganisationPage() {
  const { can } = usePermissions();
  const [period, setPeriod] = useState('12');
  const startDate = useMemo(() => periodStartDate(period, null), [period]);
  const { data, loading, error, reload } = useOrganisation(startDate);
  // Tuile « Préventifs en retard » : omise si l'échéancier est indisponible, ou sans appel
  // si l'utilisateur n'a pas le droit de le lire (un 403 afficherait une erreur globale).
  const canReadSchedule = can(PERM.preventive.schedule);
  const overdue = usePreventiveSchedule({ state: 'overdue' }, canReadSchedule);
  const overdueCount =
    !canReadSchedule || overdue.loading || overdue.error ? null : overdue.items.length;

  if (!can(PERM.stats.organisation)) return <Navigate to="/" replace />;

  return (
    <>
      <PageHeader title="Organisation" description="Interruptions, urgences, préventif : l'organisation du travail de l'équipe" icon={Users} />
      <Container size="4">
        <Flex align="center" gap="2" mb="3" wrap="wrap">
          <Select.Root value={period} onValueChange={setPeriod} size="1">
            <Select.Trigger aria-label="Période" />
            <Select.Content>
              {PERIODS.map((o) => <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>)}
            </Select.Content>
          </Select.Root>
        </Flex>
        {error && <ErrorState error={error} onRetry={reload} />}
        {!error && !data && <LoadingState fullscreen={false} message="Chargement…" />}
        {!error && data && (
          <Box style={{ opacity: loading ? 0.6 : 1 }}><Body data={data} overdueCount={overdueCount} /></Box>
        )}
      </Container>
    </>
  );
}
