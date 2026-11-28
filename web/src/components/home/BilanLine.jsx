/**
 * @fileoverview Ligne de bilan de l'accueil direction : à qualifier, tranche la plus ancienne,
 * entrées et sorties, tendance. Un lien déplie le bilan détaillé.
 * @module components/home/BilanLine
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Flex, Text } from '@radix-ui/themes';
import DemandBilan from '@/components/home/DemandBilan';
import { flowTotal, oldestBucket, trendSentence } from '@/hooks/home/decisionQueue';

const Figure = ({ value, children }) => (
  <Text size="2" color="gray"><Text weight="bold" color="gray" highContrast>{value}</Text> {children}</Text>
);
Figure.propTypes = { value: PropTypes.number.isRequired, children: PropTypes.node.isRequired };

export default function BilanLine({ stats }) {
  const [open, setOpen] = useState(false);
  const oldest = oldestBucket(stats.age_buckets);
  const trend = trendSentence(stats.trend_direction);
  return (
    <Card asChild>
      <section aria-label="Bilan en une ligne">
        <Flex wrap="wrap" align="center" gap="2" columnGap="6">
          <Figure value={stats.stock}>demandes à qualifier</Figure>
          {oldest && oldest.count > 0 && (
            <Text size="2" color="red"><Text weight="bold">{oldest.count}</Text> depuis plus de {oldest.from_days} jours</Text>
          )}
          <Text size="2" color="gray">
            <Text weight="bold" highContrast>{flowTotal(stats.flow, 'created')}</Text> entrées,{' '}
            <Text weight="bold" highContrast>{flowTotal(stats.flow, 'accepted', 'rejected')}</Text> sorties
            sur {stats.flow.length} semaines
          </Text>
          {trend && <Text size="2" color="gray">{trend}</Text>}
          <Button size="1" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? 'Masquer le bilan détaillé' : 'Voir le bilan détaillé'}
          </Button>
        </Flex>
        {open && <DemandBilan stats={stats} />}
      </section>
    </Card>
  );
}

BilanLine.propTypes = { stats: PropTypes.object.isRequired };
