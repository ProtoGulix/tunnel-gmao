/**
 * @fileoverview Page Synthèse de l'audit : partage des tâches et décisions hors travail normal
 * (ADR 0032). Chiffres d'équipe uniquement, aucun détail par personne.
 * @module pages/audit-synthese/AuditSynthesePage
 */

import { lazy, Suspense, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Box, Container, Flex, Select, Text } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { PeriodFigures, MonthlyTable, DecisionsTable } from '@/components/audit-synthese/AuditSyntheseFigures';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { useAuditSynthese } from '@/hooks/audit-synthese/useAuditSynthese';

// Recharts n'est téléchargé qu'à l'affichage des graphiques (ADR 0020)
const Charts = lazy(() => import('@/components/audit-synthese/AuditSyntheseCharts'));

const PERIODS = [
  { value: '3', label: '3 mois' },
  { value: '6', label: '6 mois' },
  { value: '12', label: '12 mois' },
];

function Body({ data }) {
  const hasIncomplete = data.monthly.some((m) => m.incomplete_data);
  return (
    <>
      <Text as="p" size="2" color="gray" mb="3">{DEFINITIONS.roles}</Text>
      {hasIncomplete && <Text as="p" size="1" color="gray" mb="3">{DEFINITIONS.incomplete}</Text>}
      <PeriodFigures totals={data.totals} />
      <Suspense fallback={<LoadingState fullscreen={false} message="Chargement des graphiques…" />}>
        <Charts monthly={data.monthly} />
      </Suspense>
      <MonthlyTable monthly={data.monthly} />
      <DecisionsTable decisions={data.decisions} monthly={data.monthly} />
    </>
  );
}
Body.propTypes = { data: PropTypes.object.isRequired };

export default function AuditSynthesePage() {
  const { can } = usePermissions();
  const [period, setPeriod] = useState('3');
  const { data, loading, error, reload } = useAuditSynthese(Number(period));

  if (!can(PERM.stats.auditSynthese)) return <Navigate to="/" replace />;

  return (
    <>
      <PageHeader title="Synthèse de l'audit" description="Partage des tâches et décisions hors travail normal" icon={ClipboardList} />
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
        {!error && data && <Box style={{ opacity: loading ? 0.6 : 1 }}><Body data={data} /></Box>}
      </Container>
    </>
  );
}
