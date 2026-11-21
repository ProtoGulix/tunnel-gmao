/**
 * @fileoverview Onglet « Audit » du Bilan : synthèse de l'audit (ADR 0032, 0033).
 * Chiffres d'équipe uniquement, aucun détail par personne.
 * @module components/bilan/tabs/AuditTab
 */

import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { PeriodFigures, MonthlyTable, DecisionsTable } from '@/components/audit-synthese/AuditSyntheseFigures';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';
import { useAuditSynthese } from '@/hooks/audit-synthese/useAuditSynthese';

// Recharts n'est téléchargé qu'à l'affichage des graphiques (ADR 0020)
const Charts = lazy(() => import('@/components/audit-synthese/AuditSyntheseCharts'));

function Body({ data }) {
  const hasIncomplete = data.monthly.some((m) => m.incomplete_data);
  return (
    <>
      <Text as="p" size="2" color="gray" mb="3">{DEFINITIONS.roles}</Text>
      <PeriodFigures totals={data.totals} />
      {hasIncomplete && <Text as="p" size="1" color="gray" mb="3">{DEFINITIONS.incomplete}</Text>}
      <Suspense fallback={<LoadingState fullscreen={false} message="Chargement des graphiques…" />}>
        <Charts monthly={data.monthly} />
      </Suspense>
      <MonthlyTable monthly={data.monthly} />
      <DecisionsTable decisions={data.decisions} monthly={data.monthly} />
    </>
  );
}
Body.propTypes = { data: PropTypes.object.isRequired };

export default function AuditTab({ months }) {
  const { data, loading, error, reload } = useAuditSynthese(months);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <LoadingState fullscreen={false} message="Chargement…" />;
  return <Box style={{ opacity: loading ? 0.6 : 1 }}><Body data={data} /></Box>;
}
AuditTab.propTypes = { months: PropTypes.number.isRequired };
