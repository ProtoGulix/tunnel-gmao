/**
 * @fileoverview Répartition des causes (facteurs de complexité)
 * @module components/charge/CauseBreakdownSection
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Heading, Table, Progress } from '@radix-ui/themes';
import { Wrench, Info } from 'lucide-react';
import { formatHours, formatPercent } from './constants';

/**
 * Trouve la couleur d'une catégorie depuis la config API
 */
const findCategoryColor = (category, categorieColors) => {
  if (!category || !categorieColors) return '#6b7280';
  const found = categorieColors.find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  );
  return found?.color || '#6b7280';
};

/**
 * Répartition des causes (facteurs de complexité)
 */
export function CauseBreakdownSection({ causes, categorieColors }) {
  if (!causes || causes.length === 0) {
    return (
      <Box mb="5">
        <Heading size="4" mb="3">
          <Flex align="center" gap="2">
            <Wrench size={20} />
            Répartition des causes
          </Flex>
        </Heading>
        <Card>
          <Flex direction="column" align="center" p="5">
            <Info size={32} color="var(--gray-8)" />
            <Text color="gray" mt="2">Aucune cause identifiée sur cette période</Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  // Trier par heures décroissantes
  const sortedCauses = [...causes].sort((a, b) => b.hours - a.hours);

  return (
    <Box mb="5">
      <Heading size="4" mb="3">
        <Flex align="center" gap="2">
          <Wrench size={20} />
          Répartition des causes du temps de dépannage
        </Flex>
      </Heading>
      
      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Facteur</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Heures</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Actions</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Part</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ width: '30%' }}>Répartition</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedCauses.map((cause) => {
              const color = findCategoryColor(cause.category, categorieColors);
              return (
                <Table.Row key={cause.code}>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      <Box
                        style={{
                          minWidth: 40,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: color,
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {cause.code}
                      </Box>
                      <Flex direction="column">
                        <Text size="2">{cause.label || cause.code}</Text>
                        {cause.category && (
                          <Text size="1" color="gray">{cause.category}</Text>
                        )}
                      </Flex>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Text weight="bold">{formatHours(cause.hours)}</Text>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Text color="gray">{cause.actionCount}</Text>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <Text>{formatPercent(cause.percent)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Box
                      style={{
                        height: 8,
                        borderRadius: 4,
                        background: `linear-gradient(to right, ${color} ${cause.percent || 0}%, var(--gray-4) ${cause.percent || 0}%)`,
                      }}
                    />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Card>
    </Box>
  );
}

CauseBreakdownSection.propTypes = {
  causes: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    category: PropTypes.string,
    hours: PropTypes.number.isRequired,
    actionCount: PropTypes.number,
    percent: PropTypes.number,
  })),
  categorieColors: PropTypes.arrayOf(PropTypes.shape({
    category: PropTypes.string,
    color: PropTypes.string,
  })),
};
