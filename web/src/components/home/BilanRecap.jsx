/**
 * @fileoverview Ligne de rappel du bilan replié : stock, tranche la plus ancienne, tuiles et
 * filtre actif. Un clic sur le rappel ou sur Effacer rouvre le bilan.
 * @module components/home/BilanRecap
 */
import PropTypes from 'prop-types';
import { Button, Flex, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import { TILE_IDS } from '@/hooks/home/bilanFilter';
import { oldestBucketCode } from '@/hooks/home/bilanView';

export default function BilanRecap({ stats, titles, counts, label, onReopen }) {
  const oldest = stats.age_buckets.find((b) => b.code === oldestBucketCode(stats.age_buckets));
  const parts = [`Stock ${stats.stock}`];
  if (oldest) parts.push(`${oldest.label} ${oldest.count}`);
  for (const id of TILE_IDS) parts.push(`${titles[id]} ${counts[id]}`);
  return (
    <Flex align="center" gap="3" px="4" pt="2" style={{ flexShrink: 0 }}>
      <button
        type="button" onClick={onReopen} title="Rouvrir le bilan"
        style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
      >
        <Text size="2" color="gray">{parts.join(', ')}</Text>
      </button>
      <Button size="1" variant="soft" onClick={onReopen}>
        {label} <X size={12} aria-hidden />
      </Button>
    </Flex>
  );
}

BilanRecap.propTypes = {
  stats: PropTypes.object.isRequired,
  titles: PropTypes.objectOf(PropTypes.string).isRequired,
  counts: PropTypes.objectOf(PropTypes.number).isRequired,
  label: PropTypes.string.isRequired,
  onReopen: PropTypes.func.isRequired,
};
