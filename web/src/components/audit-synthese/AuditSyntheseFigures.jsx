/**
 * @fileoverview Synthèse de l'audit sans graphique : chiffres de la période, tableau par mois,
 * décisions par type et motif
 * @module components/audit-synthese/AuditSyntheseFigures
 */

import PropTypes from 'prop-types';
import { Badge, Box, Grid, Table, Text } from '@radix-ui/themes';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';
import { formatMonthLong } from '@/hooks/equipements/dashboardFormat';
import { formatPct, formatNumber } from '@/hooks/organisation/organisationFormat';
import { groupDecisions } from '@/hooks/audit-synthese/auditSyntheseFormat';

function Figure({ label, value, detail, definition }) {
  return (
    <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" color="gray">{label}</Text>
      <Text as="div" size="4" weight="bold">{value}</Text>
      <Text as="div" size="1" color="gray">{detail}</Text>
      <Text as="div" size="1" color="gray" mt="1">{definition}</Text>
    </Box>
  );
}
Figure.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  detail: PropTypes.string.isRequired,
  definition: PropTypes.string.isRequired,
};

/** Chiffres de la période choisie, un par indicateur, avec sa définition */
export function PeriodFigures({ totals }) {
  return (
    <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="2" mb="4">
      <Figure
        label="Tâches sans garant" value={formatPct(totals.without_guarantor_share)}
        detail={`${totals.tasks_without_guarantor} sur ${totals.tasks_created} créées`}
        definition={DEFINITIONS.withoutGuarantor}
      />
      <Figure
        label="Faites sans action du garant" value={formatPct(totals.done_without_guarantor_action_share)}
        detail={`${totals.done_without_guarantor_action} sur ${totals.tasks_done_with_guarantor} terminées avec garant`}
        definition={DEFINITIONS.doneWithoutGuarantorAction}
      />
      <Figure
        label="Repérées sur le terrain" value={formatPct(totals.spotted_in_field_share)}
        detail={`${totals.spotted_in_field} sur ${totals.tasks_done_with_guarantor} terminées avec garant`}
        definition={DEFINITIONS.spottedInField}
      />
      <Figure
        label="Tâches partagées" value={formatPct(totals.shared_tasks_share)}
        detail={`${totals.shared_tasks} sur ${totals.tasks_done} terminées`}
        definition={DEFINITIONS.sharedTasks}
      />
      <Figure
        label="Décisions hors travail normal" value={formatNumber(totals.decisions_total, 0)}
        detail={`sur ${totals.audit_events} événements du journal`}
        definition={DEFINITIONS.decisions}
      />
      <Figure
        label="Modifications automatiques" value={formatPct(totals.system_share)}
        detail={`${totals.system_events} sur ${totals.audit_events} événements`}
        definition={DEFINITIONS.system}
      />
    </Grid>
  );
}
PeriodFigures.propTypes = { totals: PropTypes.object.isRequired };

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
    <Box mt="4">
      <Text as="div" size="2" weight="medium">Valeurs par mois</Text>
      <Box style={{ overflowX: 'auto' }}>
        <Table.Root size="1" mt="1">
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
    </Box>
  );
}
MonthlyTable.propTypes = { monthly: PropTypes.array.isRequired };

/** Décisions par type et motif, une colonne par mois */
export function DecisionsTable({ decisions, monthly }) {
  const rows = groupDecisions(decisions);
  return (
    <Box mt="4">
      <Text as="div" size="2" weight="medium">Décisions hors travail normal, par type et motif</Text>
      <Text as="div" size="1" color="gray">{DEFINITIONS.decisions}</Text>
      {rows.length === 0 ? (
        <Text as="div" size="2" color="gray" mt="1">Aucune décision sur cette période.</Text>
      ) : (
        <Box style={{ overflowX: 'auto' }}>
          <Table.Root size="1" mt="1">
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
      )}
    </Box>
  );
}
DecisionsTable.propTypes = { decisions: PropTypes.array.isRequired, monthly: PropTypes.array.isRequired };
