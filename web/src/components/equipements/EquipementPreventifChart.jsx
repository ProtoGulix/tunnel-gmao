/**
 * @fileoverview Courbe de l'écart réalisation / échéance par plan (Recharts, chargé à la demande)
 * @module components/equipements/EquipementPreventifChart
 *
 * Ligne zéro = échéance ; au-dessus : retard ; en dessous : avance.
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatDate } from '@/components/equipements/EquipementDetailSections';
import { deltaBadgeLabel } from '@/config/preventiveConfig';

const COLORS = ['var(--blue-9)', 'var(--orange-9)', 'var(--violet-9)', 'var(--green-9)', 'var(--red-9)', 'var(--cyan-9)'];
const TICK = { fill: 'var(--gray-11)', fontSize: 11, fontFamily: 'var(--default-font-family)' };

function DeltaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box style={{ background: 'var(--color-panel-solid)', border: '1px solid var(--gray-a6)', borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-3)', padding: '6px 10px' }}>
      <Text as="div" size="1" weight="medium" mb="1">{formatDate(label)}</Text>
      {payload.map((p) => (
        <Flex key={p.dataKey} gap="2" align="center">
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color }} />
          <Text size="1">{p.name}</Text>
          <Text size="1" weight="medium" style={{ marginLeft: 'auto', paddingLeft: 12 }}>{deltaBadgeLabel(p.value)}</Text>
        </Flex>
      ))}
    </Box>
  );
}
DeltaTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, label: PropTypes.string };

export default function EquipementPreventifChart({ rows, plans }) {
  return (
    <Box style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--gray-a4)" vertical={false} />
          <XAxis dataKey="date" tick={TICK} tickFormatter={formatDate} />
          <YAxis tick={TICK} width={36} unit=" j" allowDecimals={false} />
          <ReferenceLine y={0} stroke="var(--gray-9)" strokeDasharray="4 3" label={{ value: 'Échéance', fill: 'var(--gray-11)', fontSize: 10, position: 'insideTopLeft' }} />
          <Tooltip content={<DeltaTooltip />} />
          {plans.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {plans.map((p, i) => (
            <Line key={p.code} dataKey={p.code} name={p.label} stroke={COLORS[i % COLORS.length]} strokeWidth={2} connectNulls dot={{ r: 3 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
EquipementPreventifChart.propTypes = {
  rows: PropTypes.array.isRequired,
  plans: PropTypes.array.isRequired,
};
