/**
 * @fileoverview Graphiques mensuels de la page Organisation (Recharts, chargé à la demande, ADR 0020).
 * Une seule échelle verticale par graphique, même axe des mois pour tous.
 * @module components/organisation/OrganisationCharts
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { typeColor } from '@/components/equipements/dashboardColors';
import { DEFINITIONS } from '@/components/organisation/definitions';
import { formatMonthShort, formatMonthLong } from '@/hooks/equipements/dashboardFormat';
import { formatPct, formatNumber, formatHours } from '@/hooks/organisation/organisationFormat';

const PANEL = 'var(--color-panel-solid)';
const TICK = { fill: 'var(--gray-11)', fontSize: 11, fontFamily: 'var(--default-font-family)' };
const MARGIN = { top: 4, right: 4, bottom: 0, left: 0 };
const ACCENT = 'var(--accent-9)';

const monthAxis = <XAxis dataKey="month" tickFormatter={formatMonthShort} tick={TICK} axisLine={false} tickLine={false} minTickGap={12} />;
const grid = <CartesianGrid vertical={false} stroke="var(--gray-a4)" strokeDasharray="3 3" />;

function Swatch({ color }) {
  return <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />;
}
Swatch.propTypes = { color: PropTypes.string.isRequired };

function TooltipBox({ title, rows }) {
  return (
    <Box style={{ background: PANEL, border: '1px solid var(--gray-a6)', borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" weight="medium" mb="1">{title}</Text>
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
TooltipBox.propTypes = { title: PropTypes.string.isRequired, rows: PropTypes.array.isRequired };

// Infobulle d'une série : `format` reçoit la valeur brute de la ligne du mois
function seriesTooltip(rowsOf) {
  function SeriesTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    return <TooltipBox title={formatMonthLong(row.month)} rows={rowsOf(row)} />;
  }
  SeriesTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };
  return SeriesTooltip;
}

// Cadre commun : titre, graphique, légende éventuelle, définition en une phrase
function ChartBlock({ title, ariaLabel, definition, legend, height = 160, children }) {
  return (
    <Box mt="4">
      <Text as="div" size="2" weight="medium" mb="1">{title}</Text>
      <Box style={{ height }} role="img" aria-label={ariaLabel ?? title}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </Box>
      {legend && (
        <Flex gap="3" wrap="wrap" mt="1">
          {legend.map((i) => (
            <Flex key={i.key} align="center" gap="1"><Swatch color={i.color} /><Text size="1">{i.label}</Text></Flex>
          ))}
        </Flex>
      )}
      <Text as="div" size="1" color="gray" mt="1">{definition}</Text>
    </Box>
  );
}
ChartBlock.propTypes = {
  title: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string,
  definition: PropTypes.string.isRequired,
  legend: PropTypes.array,
  height: PropTypes.number,
  children: PropTypes.element.isRequired,
};

// Un mois sans dénominateur (valeur null) n'a pas de barre : le tooltip écrit « — »
function ShareChart({ monthly, field, title, definition, color, label }) {
  const rows = monthly.map((m) => ({ month: m.month, value: m[field] }));
  const tooltip = seriesTooltip((r) => [{ key: field, label, color, value: formatPct(r.value) }]);
  return (
    <ChartBlock title={title} definition={definition}>
      <BarChart data={rows} margin={MARGIN}>
        {grid}
        {monthAxis}
        <YAxis domain={[0, 100]} width={40} tickFormatter={(v) => `${v} %`} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip content={tooltip} cursor={{ fill: 'var(--gray-a3)' }} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartBlock>
  );
}
ShareChart.propTypes = {
  monthly: PropTypes.array.isRequired,
  field: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  definition: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const HOUR_SERIES = [
  { key: 'CUR', label: 'Curatif', color: typeColor('CUR') },
  { key: 'PRE', label: 'Préventif', color: typeColor('PRE') },
  { key: 'PRO', label: 'Projet', color: typeColor('PRO') },
  { key: 'other', label: 'Autres', color: typeColor(null) },
];

function HoursChart({ monthly }) {
  const rows = monthly.map((m) => ({ month: m.month, ...m.hours }));
  const tooltip = seriesTooltip((r) => [
    ...HOUR_SERIES.map((s) => ({ ...s, value: formatHours(r[s.key]) })),
    { key: 'total', label: 'Total', color: 'transparent', value: formatHours(r.total) },
  ]);
  return (
    <ChartBlock title="Heures par type d'intervention" definition={DEFINITIONS.hours} legend={HOUR_SERIES} height={180}>
      <BarChart data={rows} margin={MARGIN}>
        {grid}
        {monthAxis}
        <YAxis width={40} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip content={tooltip} cursor={{ fill: 'var(--gray-a3)' }} />
        {HOUR_SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} stackId="hours" fill={s.color} stroke={PANEL} strokeWidth={2} isAnimationActive={false} />
        ))}
      </BarChart>
    </ChartBlock>
  );
}
HoursChart.propTypes = { monthly: PropTypes.array.isRequired };

// Courbe de la moyenne : un mois sans journée de technicien (null) laisse un trou, pas un 0
function AverageChart({ monthly }) {
  const rows = monthly.map((m) => ({ month: m.month, value: m.avg_interventions_per_tech_day }));
  const tooltip = seriesTooltip((r) => [{ key: 'avg', label: 'Moyenne', color: ACCENT, value: formatNumber(r.value) }]);
  return (
    <ChartBlock title="Interventions par journée de technicien" definition={DEFINITIONS.average}>
      <LineChart data={rows} margin={MARGIN}>
        {grid}
        {monthAxis}
        <YAxis width={40} domain={[0, 'auto']} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip content={tooltip} />
        <Line dataKey="value" type="monotone" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ChartBlock>
  );
}
AverageChart.propTypes = { monthly: PropTypes.array.isRequired };

export default function OrganisationCharts({ monthly }) {
  return (
    <>
      <ShareChart
        monthly={monthly} field="interrupted_share" title="Part des chantiers coupés par une urgence"
        definition={DEFINITIONS.interrupted} color={ACCENT} label="Chantiers coupés"
      />
      <ShareChart
        monthly={monthly} field="urgent_share" title="Part d'urgences"
        definition={DEFINITIONS.urgent} color={typeColor('CUR')} label="Urgences"
      />
      <HoursChart monthly={monthly} />
      <AverageChart monthly={monthly} />
      <ShareChart
        monthly={monthly} field="scattered_days_share" title="Journées à 3 interventions ou plus"
        definition={DEFINITIONS.scattered} color={ACCENT} label="Journées dispersées"
      />
    </>
  );
}
OrganisationCharts.propTypes = { monthly: PropTypes.array.isRequired };
