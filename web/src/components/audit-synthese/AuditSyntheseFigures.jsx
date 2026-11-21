/**
 * @fileoverview Synthèse de l'audit : tableau par mois et décisions par type et motif
 * (les chiffres de la période sont dans AuditKeyFigures)
 * @module components/audit-synthese/AuditSyntheseFigures
 */

import PropTypes from 'prop-types';
import { Badge, Box, Table, Text } from '@radix-ui/themes';
import { formatMonthLong } from '@/hooks/equipements/dashboardFormat';
import { formatPct } from '@/hooks/organisation/organisationFormat';
import { groupDecisions } from '@/hooks/audit-synthese/auditSyntheseFormat';

function MonthCell({ month }) {
  return (
    <Table.RowHeaderCell>
      {formatMonthLong(month.month)}
      {month.incomplete_data && (
        <Badge color="gray" variant="soft" size="1" ml="2">données incomplètes</Badge>
      )}
    </Table.RowHeaderCell>
  );
}
MonthCell.propTypes = { month: PropTypes.object.isRequired };

const COLUMNS = [
  ['Tâches créées', (m) => String(m.tasks_created)],
  ['Sans garant', (m) => formatPct(m.without_guarantor_share)],
  ['Terminées', (m) => String(m.tasks_done)],
  ['Sans action du garant', (m) => formatPct(m.done_without_guarantor_action_share)],
  ['Repérées terrain', (m) => formatPct(m.spotted_in_field_share)],
  ['Partagées', (m) => formatPct(m.shared_tasks_share)],
  ['Décisions', (m) => String(m.decisions_total)],
  ['Automatique', (m) => formatPct(m.system_share)],
];

/** Valeurs par mois, avec le signalement des mois à données incomplètes */
export function MonthlyTable({ monthly }) {
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Mois</Table.ColumnHeaderCell>
            {COLUMNS.map(([title]) => <Table.ColumnHeaderCell key={title} justify="end">{title}</Table.ColumnHeaderCell>)}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {monthly.map((m) => (
            <Table.Row key={m.month}>
              <MonthCell month={m} />
              {COLUMNS.map(([title, get]) => <Table.Cell key={title} justify="end">{get(m)}</Table.Cell>)}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
MonthlyTable.propTypes = { monthly: PropTypes.array.isRequired };

/** Décisions par type et motif, une colonne par mois */
export function DecisionsTable({ decisions, monthly }) {
  const rows = groupDecisions(decisions);
  if (rows.length === 0) return <Text as="div" size="2" color="gray">Aucune décision sur cette période.</Text>;
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table.Root size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Motif</Table.ColumnHeaderCell>
            {monthly.map((m) => (
              <Table.ColumnHeaderCell key={m.month} justify="end">{formatMonthLong(m.month)}</Table.ColumnHeaderCell>
            ))}
            <Table.ColumnHeaderCell justify="end">Total</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.key}>
              <Table.RowHeaderCell>{r.type}</Table.RowHeaderCell>
              <Table.Cell>{r.reason}</Table.Cell>
              {monthly.map((m) => <Table.Cell key={m.month} justify="end">{r.byMonth[m.month] ?? 0}</Table.Cell>)}
              <Table.Cell justify="end">{r.total}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
DecisionsTable.propTypes = { decisions: PropTypes.array.isRequired, monthly: PropTypes.array.isRequired };
