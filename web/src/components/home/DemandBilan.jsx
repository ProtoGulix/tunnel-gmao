/**
 * @fileoverview Bilan des demandes à qualifier (ADR 0046) : flux, âge, où. Chaque chiffre
 * cliquable choisit le filtre de la liste.
 * @module components/home/DemandBilan
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import FigureCard from '@/components/bilan/FigureCard';
import BarList from '@/components/home/BarList';
import { flowSeries, flowTotal } from '@/hooks/home/bilanFilter';
import { PLACE_LIMIT, placeLabel, limitItems, oldestBucketCode } from '@/hooks/home/bilanView';

const Block = ({ title, children }) => (
  <Box style={{ flex: '1 1 260px', minWidth: 0 }}>
    <Text as="div" size="2" weight="bold" mb="2">{title}</Text>
    {children}
  </Box>
);
Block.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function FlowBlock({ stats, active, onSelect }) {
  const { flow, stock } = stats;
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
          value={String(stock)} detail="à qualifier" trend={stats.trend_direction}
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

const PLACE_KINDS = [['site', 'Sites', 'sites'], ['equipment', 'Équipements', 'equipments']];

function PlaceList({ title, list, activeKey, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const items = limitItems(list, expanded).map((s) => ({
    key: s.id, label: placeLabel(s), count: s.count,
    note: s.oldest_days == null ? '' : `plus ancienne ${s.oldest_days} j`,
    title: `${s.count} demandes${s.oldest_days == null ? '' : `, la plus ancienne ${s.oldest_days} j`}`,
  }));
  return (
    <Box mb="2">
      <Text as="div" size="1" color="gray" mb="1">{title}</Text>
      <BarList items={items} activeKey={activeKey} onSelect={onSelect} />
      {list.length > items.length && (
        <Button size="1" variant="ghost" onClick={() => setExpanded(true)}>Voir tout ({list.length})</Button>
      )}
      {expanded && list.length > PLACE_LIMIT && (
        <Button size="1" variant="ghost" onClick={() => setExpanded(false)}>Réduire</Button>
      )}
    </Box>
  );
}
PlaceList.propTypes = {
  title: PropTypes.string.isRequired, list: PropTypes.array.isRequired,
  activeKey: PropTypes.string, onSelect: PropTypes.func.isRequired,
};

export default function DemandBilan({ stats, filter, onSelect }) {
  const pick = (kind) => (value) => onSelect({ kind, value });
  const filterKey = (kind) => (filter?.kind === kind ? filter.value : undefined);
  return (
    <Flex gap="5" wrap="wrap" px="4" pt="3">
      <Block title="Flux">
        <FlowBlock stats={stats} active={filter?.kind === 'stock'} onSelect={onSelect} />
      </Block>
      <Block title="Âge">
        <BarList
          items={stats.age_buckets.map((b) => ({ key: b.code, label: b.label, count: b.count }))}
          activeKey={filterKey('age')} alertKey={oldestBucketCode(stats.age_buckets)} onSelect={pick('age')}
        />
      </Block>
      <Block title="Où">
        {PLACE_KINDS.map(([kind, title, field]) => (
          <PlaceList key={kind} title={title} list={stats[field]} activeKey={filterKey(kind)} onSelect={pick(kind)} />
        ))}
      </Block>
    </Flex>
  );
}
DemandBilan.propTypes = {
  stats: PropTypes.object.isRequired,
  filter: PropTypes.shape({ kind: PropTypes.string, value: PropTypes.string }),
  onSelect: PropTypes.func.isRequired,
};
