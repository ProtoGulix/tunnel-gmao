/**
 * @fileoverview Bilan détaillé des demandes à qualifier (ADR 0046) : flux et âge. Déplié depuis
 * la ligne de bilan de l'accueil direction ; les lieux sont dans « Où ça s'entasse ».
 * @module components/home/DemandBilan
 */
import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import FigureCard from '@/components/bilan/FigureCard';
import BarList from '@/components/home/BarList';
import { flowSeries, flowTotal, oldestBucket } from '@/hooks/home/decisionQueue';

const Block = ({ title, children }) => (
  <Box style={{ flex: '1 1 260px', minWidth: 0 }}>
    <Text as="div" size="2" weight="bold" mb="2">{title}</Text>
    {children}
  </Box>
);
Block.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function FlowBlock({ stats }) {
  const { flow, stock } = stats;
  const weeks = `sur ${flow.length} semaines`;
  return (
    <Flex direction="column" gap="2">
      <FigureCard
        label="Stock" definition="Demandes nouvelles ou en attente, fin de semaine"
        value={String(stock)} detail="à qualifier" trend={stats.trend_direction}
        series={flowSeries(flow, 'stock_end')} seriesFormat={String}
      />
      <Flex gap="2">
        <Box style={{ flex: 1 }}>
          <FigureCard compact label="Entrées" definition="Demandes créées" value={String(flowTotal(flow, 'created'))} detail={weeks} />
        </Box>
        <Box style={{ flex: 1 }}>
          <FigureCard
            compact label="Sorties" definition="Demandes acceptées ou rejetées"
            value={String(flowTotal(flow, 'accepted', 'rejected'))}
            detail={`${flowTotal(flow, 'accepted')} acceptées, ${flowTotal(flow, 'rejected')} rejetées`}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
FlowBlock.propTypes = { stats: PropTypes.object.isRequired };

export default function DemandBilan({ stats }) {
  const oldest = oldestBucket(stats.age_buckets);
  return (
    <Flex gap="5" wrap="wrap" pt="3">
      <Block title="Flux"><FlowBlock stats={stats} /></Block>
      <Block title="Âge">
        <BarList
          items={stats.age_buckets.map((b) => ({ key: b.code, label: b.label, count: b.count }))}
          alertKey={oldest?.count > 0 ? oldest.code : undefined}
        />
      </Block>
    </Flex>
  );
}
DemandBilan.propTypes = { stats: PropTypes.object.isRequired };
