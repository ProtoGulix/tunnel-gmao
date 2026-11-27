/**
 * @fileoverview Bilan des demandes à qualifier (ADR 0046) : flux, âge, où. Chaque chiffre
 * cliquable choisit le filtre de la liste.
 * @module components/home/DemandBilan
 */
import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import FigureCard from '@/components/bilan/FigureCard';
import BarList from '@/components/home/BarList';
import { flowSeries, flowTotal, trendDirection } from '@/hooks/home/bilanFilter';

const Block = ({ title, children }) => (
  <Box style={{ flex: '1 1 260px', minWidth: 0 }}>
    <Text as="div" size="2" weight="bold" mb="2">{title}</Text>
    {children}
  </Box>
);
Block.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function FlowBlock({ stats, active, onSelect }) {
  const { flow, stock, trend } = stats;
  const out = flowTotal(flow, 'accepted', 'rejected');
  const weeks = `sur ${flow.length} semaines`;
  return (
    <Flex direction="column" gap="2">
      <button
        type="button" onClick={() => onSelect({ kind: 'stock' })} aria-pressed={active}
        style={{ all: 'unset', cursor: 'pointer', display: 'block', outline: active ? '2px solid var(--accent-8)' : undefined, borderRadius: 'var(--radius-3)' }}
      >
        <FigureCard
          label="Stock" definition="Demandes nouvelles ou en attente, fin de semaine"
          value={String(stock)} detail="à qualifier" trend={trendDirection(trend)}
          series={flowSeries(flow, 'stock_end')} seriesFormat={String}
        />
      </button>
      <Flex gap="2">
        <Box style={{ flex: 1 }}>
          <FigureCard compact label="Entrées" definition="Demandes créées" value={String(flowTotal(flow, 'created'))} detail={weeks} />
        </Box>
        <Box style={{ flex: 1 }}>
          <FigureCard
            compact label="Sorties" definition="Demandes acceptées ou rejetées"
            value={String(out)} detail={`${flowTotal(flow, 'accepted')} acceptées, ${flowTotal(flow, 'rejected')} rejetées`}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
FlowBlock.propTypes = { stats: PropTypes.object.isRequired, active: PropTypes.bool, onSelect: PropTypes.func.isRequired };

const days = (n) => (n == null ? '' : `${n} j`);

export default function DemandBilan({ stats, filter, onSelect }) {
  const pick = (kind) => (value) => onSelect({ kind, value });
  const place = (list) => list.map((s) => ({ key: s.id, label: s.name || s.code, count: s.count, note: days(s.oldest_days) }));
  const filterKey = (kind) => (filter?.kind === kind ? filter.value : undefined);
  return (
    <Flex gap="5" wrap="wrap" px="4" pt="3">
      <Block title="Flux">
        <FlowBlock stats={stats} active={filter?.kind === 'stock'} onSelect={onSelect} />
      </Block>
      <Block title="Âge">
        <BarList
          items={stats.age_buckets.map((b) => ({ key: b.code, label: b.label, count: b.count }))}
          activeKey={filterKey('age')} onSelect={pick('age')}
        />
      </Block>
      <Block title="Où">
        <Text as="div" size="1" color="gray" mb="1">Sites</Text>
        <BarList items={place(stats.sites)} activeKey={filterKey('site')} onSelect={pick('site')} />
        <Text as="div" size="1" color="gray" mt="2" mb="1">Équipements</Text>
        <BarList items={place(stats.equipments)} activeKey={filterKey('equipment')} onSelect={pick('equipment')} />
      </Block>
    </Flex>
  );
}
DemandBilan.propTypes = {
  stats: PropTypes.object.isRequired,
  filter: PropTypes.shape({ kind: PropTypes.string, value: PropTypes.string }),
  onSelect: PropTypes.func.isRequired,
};
