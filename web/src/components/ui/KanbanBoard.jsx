/**
 * @fileoverview Kanban générique en colonnes statiques (pas de drag & drop —
 * aucune lib de ce type n'est présente dans le projet, non justifié pour ce
 * seul usage). Une colonne par valeur de référentiel, cartes rendues via
 * `renderCard`. L'édition de colonne (déplacement) se fait via un sélecteur
 * porté par la carte elle-même, pas par glisser-déposer.
 * @module components/ui/KanbanBoard
 */

import PropTypes from 'prop-types';
import { Box, Flex, Heading, ScrollArea, Text } from '@radix-ui/themes';

export default function KanbanBoard({ columns, items, getColumnKey, getRowKey, renderCard, emptyLabel }) {
  const byColumn = new Map(columns.map((c) => [c.code, []]));
  for (const item of items) {
    const key = getColumnKey(item);
    if (byColumn.has(key)) {
      byColumn.get(key).push(item);
    }
  }

  if (items.length === 0) {
    return <Text color="gray" size="2">{emptyLabel}</Text>;
  }

  return (
    <ScrollArea scrollbars="horizontal">
      <Flex gap="3" pb="2" style={{ minWidth: 'fit-content' }}>
        {columns.map((col) => {
          const colItems = byColumn.get(col.code) || [];
          return (
            <Box
              key={col.code}
              style={{
                width: 280,
                flexShrink: 0,
                background: 'var(--gray-2)',
                borderRadius: 'var(--radius-3)',
                border: '1px solid var(--gray-5)',
              }}
            >
              <Flex
                align="center"
                justify="between"
                px="3" py="2"
                style={{
                  borderBottom: '1px solid var(--gray-5)',
                  borderTop: `3px solid ${col.color || 'var(--gray-8)'}`,
                  borderTopLeftRadius: 'var(--radius-3)',
                  borderTopRightRadius: 'var(--radius-3)',
                }}
              >
                <Heading size="2">{col.label}</Heading>
                <Text size="1" color="gray">{colItems.length}</Text>
              </Flex>
              <Flex direction="column" gap="2" p="2" style={{ minHeight: 60 }}>
                {colItems.length === 0 ? (
                  <Text size="1" color="gray" style={{ padding: '8px 4px' }}>—</Text>
                ) : (
                  colItems.map((item) => (
                    <Box key={getRowKey(item)}>{renderCard(item)}</Box>
                  ))
                )}
              </Flex>
            </Box>
          );
        })}
      </Flex>
    </ScrollArea>
  );
}

KanbanBoard.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
  })).isRequired,
  items: PropTypes.array.isRequired,
  getColumnKey: PropTypes.func.isRequired,
  getRowKey: PropTypes.func.isRequired,
  renderCard: PropTypes.func.isRequired,
  emptyLabel: PropTypes.string.isRequired,
};
