/**
 * @fileoverview Graphiques du tableau de bord d'un équipement (Recharts, chargé à la demande, ADR 0020)
 * @module components/equipements/EquipementDashboardCharts
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { typeColor } from '@/components/equipements/dashboardColors';
import {
  BreakdownLegend, Swatch, typeRows, categoryRows, factorRows,
} from '@/components/equipements/EquipementDashboardFigures';
import { formatMonthShort, formatMonthLong } from '@/hooks/equipements/dashboardFormat';

const PANEL = 'var(--color-panel-solid)';
const TICK = { fill: 'var(--gray-11)', fontSize: 11, fontFamily: 'var(--default-font-family)' };
const Y_WIDTH = 32;
const MARGIN = { top: 4, right: 4, bottom: 0, left: 0 };

function TooltipBox({ title, rows }) {
  return (
    <Box style={{ background: PANEL, border: '1px solid var(--gray-a6)', borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-3)', padding: '6px 10px' }}>
      {title && <Text as="div" size="1" weight="medium" mb="1">{title}</Text>}
      {rows.map((r) => (
        <Flex key={r.key} align="center" gap="2">
          <Swatch color={r.color} />
          <Text size="1">{r.label}</Text>
          <Text size="1" weight="medium" style={{ marginLeft: 'auto', paddingLeft: 12 }}>{r.value}</Text>
        </Flex>
      ))}
    </Box>
  );
}
TooltipBox.propTypes = { title: PropTypes.string, rows: PropTypes.array.isRequired };

function Legend({ items }) {
  return (
    <Flex gap="3" wrap="wrap" mt="1">
      {items.map((i) => (
        <Flex key={i.key} align="center" gap="1">
          <Swatch color={i.color} />
          <Text size="1">{i.label}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
Legend.propTypes = { items: PropTypes.array.isRequired };

// Segment d'une pile : coins arrondis sur le haut de la pile seulement, 2 px d'écart par contour de la couleur du fond
function Segment({ x, y, width, height, fill, isTop, month, onSelectMonth }) {
  if (!(height > 0)) return null;
  const r = isTop ? Math.min(3, width / 2, height) : 0;
  const d = `M${x},${y + height}L${x},${y + r}Q${x},${y} ${x + r},${y}L${x + width - r},${y}Q${x + width},${y} ${x + width},${y + r}L${x + width},${y + height}Z`;
  return <path d={d} fill={fill} stroke={PANEL} strokeWidth={2} style={{ cursor: 'pointer' }} onClick={() => onSelectMonth(month)} />;
}
Segment.propTypes = {
  x: PropTypes.number, y: PropTypes.number, width: PropTypes.number, height: PropTypes.number,
  fill: PropTypes.string, isTop: PropTypes.bool, month: PropTypes.string, onSelectMonth: PropTypes.func.isRequired,
};

const monthAxis = <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={TICK} axisLine={false} tickLine={false} minTickGap={12} />;
const grid = <CartesianGrid vertical={false} stroke="var(--gray-a4)" strokeDasharray="3 3" />;

function ReportedByMonth({ monthly, byType, onSelectMonth }) {
  const types = byType.filter((t) => monthly.some((m) => (m.reported_by_type?.[t.code ?? 'null'] ?? 0) > 0));
  const keyOf = (t) => t.code ?? 'null';
  const rows = monthly.map((m) => ({
    month: m.month,
    ...Object.fromEntries(types.map((t) => [keyOf(t), m.reported_by_type?.[keyOf(t)] ?? 0])),
  }));
  const tooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const tipRows = types
      .filter((t) => payload[0].payload[keyOf(t)] > 0)
      .map((t) => ({ key: keyOf(t), label: t.label, color: typeColor(t.code), value: payload[0].payload[keyOf(t)] }));
    return <TooltipBox title={formatMonthLong(payload[0].payload.month)} rows={tipRows} />;
  };
  return (
    <Box>
      <Text as="div" size="1" color="gray" mb="1">Interventions signalées par mois</Text>
      <Box style={{ height: 180 }} role="img" aria-label="Interventions signalées par mois et par type">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={MARGIN}>
            {grid}
            {monthAxis}
            <YAxis allowDecimals={false} width={Y_WIDTH} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={tooltip} cursor={{ fill: 'var(--gray-a3)' }} />
            {types.map((t, i) => (
              <Bar
                key={keyOf(t)}
                dataKey={keyOf(t)}
                stackId="types"
                fill={typeColor(t.code)}
                shape={(p) => (
                  <Segment
                    {...p}
                    isTop={!types.slice(i + 1).some((later) => p.payload[keyOf(later)] > 0)}
                    month={p.payload.month}
                    onSelectMonth={onSelectMonth}
                  />
                )}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Legend items={types.map((t) => ({ key: keyOf(t), label: t.label, color: typeColor(t.code) }))} />
    </Box>
  );
}
ReportedByMonth.propTypes = {
  monthly: PropTypes.array.isRequired,
  byType: PropTypes.array.isRequired,
  onSelectMonth: PropTypes.func.isRequired,
};

function HoursByMonth({ monthly }) {
  const rows = monthly.map((m) => ({ month: m.month, hours: m.time_spent_hours ?? 0 }));
  const tooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { month, hours } = payload[0].payload;
    const value = `${hours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;
    return <TooltipBox title={formatMonthLong(month)} rows={[{ key: 'h', label: 'Heures passées', color: 'var(--accent-9)', value }]} />;
  };
  return (
    <Box mt="3">
      <Text as="div" size="1" color="gray" mb="1">Heures passées par mois</Text>
      <Box style={{ height: 140 }} role="img" aria-label="Heures passées par mois">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={MARGIN}>
            {grid}
            {monthAxis}
            <YAxis width={Y_WIDTH} tick={TICK} axisLine={false} tickLine={false} />
            <Tooltip content={tooltip} />
            <Area dataKey="hours" type="monotone" stroke="var(--accent-9)" strokeWidth={2} fill="var(--accent-9)" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
HoursByMonth.propTypes = { monthly: PropTypes.array.isRequired };

function BreakdownBlock({ title, rows, emptyLabel, formatValue }) {
  const tooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const s = payload[0].payload;
    return <TooltipBox rows={[{ key: s.key, label: s.label, color: s.color, value: formatValue(s.amount) }]} />;
  };
  const slices = rows.filter((r) => r.amount > 0);
  return (
    <Box style={{ minWidth: 0 }}>
      <Text as="div" size="1" color="gray" mb="2">{title}</Text>
      {rows.length === 0 && <Text size="1" color="gray">{emptyLabel}</Text>}
      {rows.length > 0 && (
        <Flex align="center" gap="3">
          <PieChart width={96} height={96} role="img" aria-label={title} style={{ flexShrink: 0 }}>
            <Pie data={slices} dataKey="amount" nameKey="label" innerRadius={28} outerRadius={46} stroke={PANEL} strokeWidth={2} isAnimationActive={false}>
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} cursor={s.onSelect ? 'pointer' : 'default'} onClick={s.onSelect} />
              ))}
            </Pie>
            <Tooltip content={tooltip} />
          </PieChart>
          <BreakdownLegend rows={rows} />
        </Flex>
      )}
    </Box>
  );
}
BreakdownBlock.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  formatValue: PropTypes.func.isRequired,
};

const asHours = (v) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} h`;

export default function EquipementDashboardCharts({ data, onSelectType, onSelectMonth }) {
  return (
    <>
      <ReportedByMonth monthly={data.monthly} byType={data.by_type} onSelectMonth={onSelectMonth} />
      <HoursByMonth monthly={data.monthly} />
      <Box mt="4" style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <BreakdownBlock title="Types d'intervention" rows={typeRows(data.by_type, onSelectType)} emptyLabel="Aucune intervention." formatValue={String} />
        <BreakdownBlock title="Heures par catégorie d'action" rows={categoryRows(data.by_action_category)} emptyLabel="Aucune action." formatValue={asHours} />
        <BreakdownBlock title="Facteurs de complexité" rows={factorRows(data.by_complexity_factor)} emptyLabel="Aucun facteur renseigné." formatValue={String} />
      </Box>
    </>
  );
}
EquipementDashboardCharts.propTypes = {
  data: PropTypes.object.isRequired,
  onSelectType: PropTypes.func.isRequired,
  onSelectMonth: PropTypes.func.isRequired,
};
