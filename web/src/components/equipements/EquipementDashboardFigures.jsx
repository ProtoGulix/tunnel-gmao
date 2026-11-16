/**
 * @fileoverview Éléments du tableau de bord d'un équipement sans graphique : chiffres clés,
 * légende chiffrée des répartitions, valeurs par mois
 * @module components/equipements/EquipementDashboardFigures
 */

import PropTypes from 'prop-types';
import { Box, Button, Flex, Grid, Table, Text } from '@radix-ui/themes';
import { typeColor, codeColor } from '@/components/equipements/dashboardColors';
import { formatMonthLong, formatShare } from '@/hooks/equipements/dashboardFormat';

const num = (v) => (v ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const hours = (v) => `${num(v)} h`;

function Kpi({ label, value, unit, detail }) {
  return (
    <Box style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" color="gray">{label}</Text>
      <Text as="div" size="4" weight="bold">
        {value ?? '—'}
        {value != null && unit && <Text size="1" color="gray" weight="regular"> {unit}</Text>}
      </Text>
      {detail && <Text as="div" size="1" color="gray">{detail}</Text>}
    </Box>
  );
}
Kpi.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  unit: PropTypes.string,
  detail: PropTypes.string,
};

const optNum = (v) => (v == null ? null : num(v));

/** Bande de six chiffres clés */
export function KpiStrip({ kpis }) {
  return (
    <Grid columns={{ initial: '3', lg: '6' }} gap="2" mb="3">
      <Kpi label="Signalées" value={num(kpis.interventions_reported)} />
      <Kpi label="Fermées" value={num(kpis.interventions_closed)} />
      <Kpi label="Ouvertes maintenant" value={num(kpis.interventions_open_now)} />
      <Kpi label="Heures passées" value={num(kpis.time_spent_hours)} unit="h" detail={`${kpis.actions_count} action(s)`} />
      <Kpi label="Complexité moyenne" value={optNum(kpis.avg_complexity)} />
      <Kpi label="Délai de fermeture" value={optNum(kpis.avg_close_delay_days)} unit="j" detail="en moyenne" />
    </Grid>
  );
}
KpiStrip.propTypes = { kpis: PropTypes.object.isRequired };

export function Swatch({ color }) {
  return <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />;
}
Swatch.propTypes = { color: PropTypes.string.isRequired };

/**
 * Légende chiffrée d'une répartition : pastille, libellé, valeur et part en %.
 * @param {Array<{key: string, label: string, color: string, valueLabel: string, share: string, onSelect?: Function}>} rows
 */
export function BreakdownLegend({ rows }) {
  return (
    <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
      {rows.map((row) => (
        <Flex key={row.key} align="center" gap="2">
          <Swatch color={row.color} />
          {row.onSelect ? (
            <Button size="1" variant="ghost" color="gray" highContrast onClick={row.onSelect} style={{ minWidth: 0 }}>
              {row.label}
            </Button>
          ) : (
            <Text size="1" truncate>{row.label}</Text>
          )}
          <Text size="1" color="gray" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {row.valueLabel} · {row.share}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
BreakdownLegend.propTypes = { rows: PropTypes.array.isRequired };

// Ajoute à chaque ligne sa part du total de la métrique tracée par l'anneau
function withShares(rows) {
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  return rows.map((r) => ({ ...r, share: formatShare(r.amount, total) }));
}

export function typeRows(byType, onSelectType) {
  return withShares(
    byType
      .filter((t) => t.count > 0)
      .map((t) => ({
        key: t.code ?? 'null',
        label: t.label,
        color: typeColor(t.code),
        amount: t.count,
        valueLabel: `${t.count} (${hours(t.time_spent_hours)})`,
        onSelect: t.code ? () => onSelectType(t) : undefined,
        source: t,
      }))
  );
}

export function categoryRows(byCategory) {
  return withShares(
    byCategory.map((c) => ({
      key: c.code ?? 'null',
      label: c.name,
      color: codeColor(c.color, c.code),
      amount: c.time_spent_hours,
      valueLabel: `${hours(c.time_spent_hours)} (${c.actions_count})`,
    }))
  );
}

export function factorRows(byFactor) {
  return withShares(
    byFactor.map((f) => ({
      key: f.code ?? 'null',
      label: f.label,
      color: codeColor(null, f.code),
      amount: f.count,
      valueLabel: String(f.count),
    }))
  );
}

/** Valeurs par mois : sert aussi de repli au clic sur une barre */
export function MonthlyTable({ monthly, onSelectMonth }) {
  return (
    <details style={{ marginTop: 'var(--space-2)' }}>
      <summary><Text size="1" color="gray">Valeurs par mois</Text></summary>
      <Table.Root size="1" mt="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Mois</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="end">Signalées</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="end">Fermées</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="end">Heures</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {monthly.map((m) => (
            <Table.Row key={m.month}>
              <Table.RowHeaderCell>
                <Button size="1" variant="ghost" color="gray" highContrast onClick={() => onSelectMonth(m.month)}>
                  {formatMonthLong(m.month)}
                </Button>
              </Table.RowHeaderCell>
              <Table.Cell justify="end">{m.reported}</Table.Cell>
              <Table.Cell justify="end">{m.closed}</Table.Cell>
              <Table.Cell justify="end">{hours(m.time_spent_hours)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </details>
  );
}
MonthlyTable.propTypes = { monthly: PropTypes.array.isRequired, onSelectMonth: PropTypes.func.isRequired };
