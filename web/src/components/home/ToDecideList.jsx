/**
 * @fileoverview « À trancher » : demandes urgentes, puis tranche la plus ancienne (tronquée),
 * puis les autres. L'ordre et la tranche viennent de l'API (ADR 0047).
 * @module components/home/ToDecideList
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import DecisionRow from '@/components/home/DecisionRow';
import { groupToDecide, visibleOld, OLD_LIMIT } from '@/hooks/home/decisionQueue';

function Group({ title, count, children }) {
  return (
    <Flex direction="column" mt="3">
      <Heading as="h3" size="2" color="gray">{title} · {count}</Heading>
      {children}
    </Flex>
  );
}
Group.propTypes = { title: PropTypes.string.isRequired, count: PropTypes.number.isRequired, children: PropTypes.node.isRequired };

export default function ToDecideList({ requests, buckets, actions }) {
  const [expanded, setExpanded] = useState(false);
  const { urgent, old, rest, oldTitle } = groupToDecide(requests, buckets);
  const row = (r) => <DecisionRow key={r.id} request={r} {...actions} />;
  const hidden = old.length - OLD_LIMIT;
  return (
    <section aria-labelledby="to-decide">
      <Flex align="baseline" gap="3" wrap="wrap">
        <Heading as="h2" size="4" id="to-decide">À trancher</Heading>
        <Text size="1" color="gray">Urgentes d’abord, puis les plus anciennes</Text>
      </Flex>
      {urgent.length + old.length + rest.length === 0 && <Text as="p" color="gray" mt="3">Aucune demande à trancher.</Text>}
      {urgent.length > 0 && <Group title="Urgentes" count={urgent.length}>{urgent.map(row)}</Group>}
      {old.length > 0 && (
        <Group title={oldTitle} count={old.length}>
          {visibleOld(old, expanded).map(row)}
          {hidden > 0 && (
            <Button size="2" variant="ghost" mt="2" style={{ alignSelf: 'flex-start' }} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Réduire' : `Voir les ${hidden} autres`}
            </Button>
          )}
        </Group>
      )}
      {rest.length > 0 && <Group title="Autres" count={rest.length}>{rest.map(row)}</Group>}
    </section>
  );
}

ToDecideList.propTypes = {
  requests: PropTypes.array.isRequired,
  buckets: PropTypes.array,
  actions: PropTypes.shape({ onAccept: PropTypes.func, onHold: PropTypes.func, onReject: PropTypes.func }).isRequired,
};
