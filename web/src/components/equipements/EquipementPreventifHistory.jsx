/**
 * @fileoverview Interventions préventives d'un équipement : liste et courbe d'écart
 * @module components/equipements/EquipementPreventifHistory
 *
 * Les écarts (delta_days) viennent de GET /preventive-occurrences/history, rien n'est calculé ici.
 */

import { lazy, Suspense, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { EntityCodeLink } from '@/components/shared/EntityCodeLink';
import { formatDate } from '@/components/equipements/EquipementDetailSections';
import {
  OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS, deltaBadgeColor, deltaBadgeLabel, historyChartData,
} from '@/config/preventiveConfig';

const Chart = lazy(() => import('@/components/equipements/EquipementPreventifChart'));

function HistoryRow({ row }) {
  const delta = deltaBadgeLabel(row.delta_days);
  return (
    <Flex
      align="center"
      gap="2"
      wrap="wrap"
      style={{ padding: '6px 8px', border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)', background: 'var(--gray-2)' }}
    >
      <Text size="2" style={{ flex: 1, minWidth: 140 }}>{row.plan_label}</Text>
      <Text size="1" color="gray">Échéance {formatDate(row.scheduled_date)}</Text>
      <Text size="1" color="gray">{row.done_on ? `Réalisée ${formatDate(row.done_on)}` : 'Non réalisée'}</Text>
      {delta && <Badge color={deltaBadgeColor(row.delta_days)} variant="soft" size="1">{delta}</Badge>}
      <Badge color={OCCURRENCE_STATUS_COLORS[row.status] ?? 'gray'} variant="soft" size="1">
        {OCCURRENCE_STATUS_LABELS[row.status] ?? row.status}
      </Badge>
      {row.intervention_id ? (
        <EntityCodeLink type="intervention" id={row.intervention_id} code={row.intervention_code} size={1} />
      ) : row.di_id ? (
        <Link to={`/interventions?tab=demandes&id=${row.di_id}`} style={{ fontSize: 12 }}>Demande</Link>
      ) : null}
    </Flex>
  );
}
HistoryRow.propTypes = { row: PropTypes.object.isRequired };

export default function EquipementPreventifHistory({ history }) {
  const { items, loading, error, refresh } = history;
  const { rows, plans } = useMemo(() => historyChartData(items), [items]);
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  if (loading && items.length === 0) return <LoadingState fullscreen={false} message="Chargement…" />;
  return (
    <Box>
      <Text weight="medium" size="2" as="div" mb="3">Interventions préventives</Text>
      {items.length === 0 ? (
        <Text size="2" color="gray">Aucune intervention préventive pour cet équipement.</Text>
      ) : (
        <Flex direction="column" gap="1" style={{ opacity: loading ? 0.6 : 1 }}>
          {items.map((row) => <HistoryRow key={row.occurrence_id} row={row} />)}
        </Flex>
      )}
      <Text weight="medium" size="2" as="div" mt="4" mb="2">Écart par rapport à l&apos;échéance</Text>
      {rows.length === 0 ? (
        <Text size="2" color="gray">Aucune réalisation à tracer pour le moment.</Text>
      ) : (
        <>
          <Text size="1" color="gray" as="div" mb="1">Au-dessus de la ligne : en retard. En dessous : en avance.</Text>
          <Suspense fallback={<LoadingState fullscreen={false} message="Chargement du graphique…" />}>
            <Chart rows={rows} plans={plans} />
          </Suspense>
        </>
      )}
    </Box>
  );
}
EquipementPreventifHistory.propTypes = {
  history: PropTypes.shape({
    items: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string,
    refresh: PropTypes.func,
  }).isRequired,
};
