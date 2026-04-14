/**
 * Carte sélecteur générique — liste cliquable avec header, état chargement/vide.
 *
 * Partagée par InterventionRequestSelector, InterventionSelector, et tout futur
 * sélecteur en liste avec la même apparence.
 *
 * Quand `locked=true`, affiche un LockedBadge au lieu de la carte.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import LockedBadge from '@/components/ui/LockedBadge';

export default function EntitySelectorCard({
  title,
  icon: Icon,
  items,
  loading,
  selectedId,
  onSelect,
  renderRow,
  onCreateClick,
  createLabel = 'Nouveau',
  emptyMessage = 'Aucun élément disponible',
  maxHeight = 480,
  locked = false,
  lockedLabel,
  lockedIcon,
  lockedSublabel,
}) {
  if (locked) {
    return (
      <LockedBadge
        icon={lockedIcon}
        label={lockedLabel ?? title}
        sublabel={lockedSublabel}
      />
    );
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Flex align="center" gap="2" px="3" py="3" style={{ borderBottom: '1px solid var(--gray-4)' }}>
        {Icon && <Icon size={18} color="var(--accent-9)" />}
        <Heading size="3" weight="bold">{title}</Heading>
        {!loading && (
          <Badge color="gray" variant="soft" size="1">{items.length}</Badge>
        )}
        <Box style={{ flex: 1 }} />
        {onCreateClick && (
          <Button size="1" variant="soft" color="blue" type="button" onClick={onCreateClick}>
            <Plus size={12} />
            {createLabel}
          </Button>
        )}
      </Flex>

      {/* Corps */}
      {loading && (
        <Flex justify="center" p="4">
          <Spinner size="2" />
        </Flex>
      )}

      {!loading && items.length === 0 && (
        <Text size="2" color="gray" style={{ display: 'block', padding: '1.5rem', textAlign: 'center' }}>
          {emptyMessage}
        </Text>
      )}

      {!loading && items.length > 0 && (
        <Box style={{ maxHeight, overflowY: 'auto' }}>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {renderRow(item, item.id === selectedId, onSelect)}
            </React.Fragment>
          ))}
        </Box>
      )}
    </Card>
  );
}

EntitySelectorCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  renderRow: PropTypes.func.isRequired,
  onCreateClick: PropTypes.func,
  createLabel: PropTypes.string,
  emptyMessage: PropTypes.string,
  maxHeight: PropTypes.number,
  locked: PropTypes.bool,
  lockedLabel: PropTypes.string,
  lockedIcon: PropTypes.elementType,
  lockedSublabel: PropTypes.string,
};
