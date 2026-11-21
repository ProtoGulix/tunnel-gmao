/**
 * @fileoverview Tableau des valeurs par mois de l'organisation du travail, replié par défaut
 * @module components/organisation/OrganisationFigures
 */

import PropTypes from 'prop-types';
import { Box, Table, Text } from '@radix-ui/themes';
import { formatMonthLong } from '@/hooks/equipements/dashboardFormat';
import {
  formatPct, formatNumber, formatHours, shareOf,
} from '@/hooks/organisation/organisationFormat';

/** Valeurs par mois, repliées par défaut */
export function MonthlyTable({ monthly }) {
  return (
    <details style={{ marginTop: 'var(--space-3)' }}>
      <summary><Text size="1" color="gray">Valeurs par mois</Text></summary>
      <Box style={{ overflowX: 'auto' }}>
        <Table.Root size="1" mt="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Mois</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Chantiers coupés</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Urgences</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Heures</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">dont curatif</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">dont préventif</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">dont projet</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">dont autres</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Part du préventif</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Interv. par journée</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Journées à 3 ou +</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {monthly.map((m) => (
              <Table.Row key={m.month}>
                <Table.RowHeaderCell>{formatMonthLong(m.month)}</Table.RowHeaderCell>
                <Table.Cell justify="end">{formatPct(m.interrupted_share)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(m.urgent_share)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.total)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.CUR)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.PRE)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.PRO)}</Table.Cell>
                <Table.Cell justify="end">{formatHours(m.hours.other)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(shareOf(m.hours.PRE, m.hours.total))}</Table.Cell>
                <Table.Cell justify="end">{formatNumber(m.avg_interventions_per_tech_day)}</Table.Cell>
                <Table.Cell justify="end">{formatPct(m.scattered_days_share)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </details>
  );
}
MonthlyTable.propTypes = { monthly: PropTypes.array.isRequired };
