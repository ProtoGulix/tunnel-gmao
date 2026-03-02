/**
 * @fileoverview Liste des templates de pieces
 * @module components/stock/PartTemplatesList
 */

import PropTypes from 'prop-types';
import { Badge, Button, Flex, Table, Text } from '@radix-ui/themes';
import { ChevronRight, Plus } from 'lucide-react';

export default function PartTemplatesList({ templates, loading, selectedId, onSelect, onCreateNew }) {
  if (loading) {
    return <Text size="2" color="gray">Chargement...</Text>;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Text size="3" weight="bold">Trames de reference ({templates.length})</Text>
        <Button size="1" variant="soft" onClick={onCreateNew}>
          <Plus size={12} /> Nouvelle
        </Button>
      </Flex>

      {templates.length === 0 && (
        <Text size="2" color="gray">Aucune trame de reference definie.</Text>
      )}

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Libelle</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Champs</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ width: 24 }} />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {templates.map((tpl) => (
            <Table.Row
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedId === tpl.id ? 'var(--blue-3)' : undefined,
              }}
            >
              <Table.Cell>
                <Text size="2" weight="bold">{tpl.code}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text size="2">{tpl.label}</Text>
              </Table.Cell>
              <Table.Cell>
                <Badge color="blue" variant="soft">v{tpl.version}</Badge>
              </Table.Cell>
              <Table.Cell>
                <Text size="2" color="gray">{tpl.fields?.length ?? 0} champ(s)</Text>
              </Table.Cell>
              <Table.Cell>
                {selectedId === tpl.id && (
                  <ChevronRight size={14} color="var(--blue-9)" />
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}

PartTemplatesList.propTypes = {
  templates: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    version: PropTypes.number.isRequired,
    fields: PropTypes.array,
  })).isRequired,
  loading: PropTypes.bool,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};
