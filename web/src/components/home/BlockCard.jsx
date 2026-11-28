/**
 * @fileoverview Carte « À voir avec l'acheteur » ou « …la production » : interventions bloquées
 * depuis le seuil de l'API, cause en pastilles. Carte vide : encart factuel (ADR 0047).
 * @module components/home/BlockCard
 */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { Check } from 'lucide-react';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import { daysLabel, emptyBlockLabel, equipmentLabel, thresholdLabel } from '@/hooks/home/decisionQueue';

function BlockItem({ item, causes }) {
  return (
    <Link
      to={entityCodeUrl('intervention', item.id)}
      style={{ display: 'block', padding: '8px 0', borderTop: '1px solid var(--gray-4)', color: 'inherit', textDecoration: 'none' }}
    >
      <Flex justify="between" gap="2">
        <Text size="2" weight="bold">{equipmentLabel(item.equipement) || item.code}</Text>
        <Text size="2" color="gray" style={{ whiteSpace: 'nowrap' }}>{daysLabel(item.days_in_status)}</Text>
      </Flex>
      <Text as="div" size="2">{item.title}</Text>
      <Flex gap="1" wrap="wrap" mt="1">
        {item.priority === 'urgent' && <Badge color="red" variant="soft">Urgente</Badge>}
        {causes.map((c) => <Badge key={c} color="gray" variant="soft" style={{ whiteSpace: 'normal' }}>{c}</Badge>)}
      </Flex>
    </Link>
  );
}
BlockItem.propTypes = { item: PropTypes.object.isRequired, causes: PropTypes.arrayOf(PropTypes.string).isRequired };

/**
 * @param {Object} props
 * @param {'parts'|'production'} props.subject
 * @param {Array} props.items - déjà triés et filtrés par l'API
 * @param {(item: Object) => string[]} props.causesOf
 */
export default function BlockCard({ title, subject, items, thresholdDays, causesOf }) {
  return (
    <Card asChild>
      <section aria-label={title}>
        <Flex align="baseline" justify="between" gap="2">
          <Heading as="h2" size="3">{title}</Heading>
          <Text size="2" color="gray">{items.length}</Text>
        </Flex>
        {items.length === 0 ? (
          <Flex gap="2" mt="2" p="2" align="start" style={{ background: 'var(--green-a3)', borderRadius: 'var(--radius-2)' }}>
            <Check size={18} color="var(--green-11)" aria-hidden="true" />
            <div>
              <Text as="div" size="2" weight="bold" color="green">Rien ne bloque de ce côté</Text>
              <Text as="div" size="1" color="gray">{emptyBlockLabel(subject, thresholdDays)}</Text>
            </div>
          </Flex>
        ) : (
          <>
            <Text as="p" size="1" color="gray" mb="1">{thresholdLabel(thresholdDays)}</Text>
            {items.map((item) => <BlockItem key={item.id} item={item} causes={causesOf(item)} />)}
          </>
        )}
      </section>
    </Card>
  );
}

BlockCard.propTypes = {
  title: PropTypes.string.isRequired,
  subject: PropTypes.oneOf(['parts', 'production']).isRequired,
  items: PropTypes.array.isRequired,
  thresholdDays: PropTypes.number.isRequired,
  causesOf: PropTypes.func.isRequired,
};
