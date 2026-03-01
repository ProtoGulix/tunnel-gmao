/**
 * @fileoverview Detail d'un template de piece
 * @module components/stock/PartTemplateDetail
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Code, Flex, Table, Text } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';

const FIELD_TYPE_LABEL = { text: 'Texte', number: 'Nombre', enum: 'Liste' };
const FIELD_TYPE_COLOR = { text: 'gray', number: 'blue', enum: 'orange' };

export default function PartTemplateDetail({ template, onDelete, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!template) return null;

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="start">
        <Box>
          <Flex align="center" gap="2">
            <Text size="4" weight="bold">{template.label || template.code}</Text>
            <Badge color="blue" variant="soft">v{template.version}</Badge>
          </Flex>
          <Text size="2" color="gray">{template.code}</Text>
        </Box>
        <Flex align="center" gap="2">
          {confirmDelete ? (
            <>
              <Button size="1" color="red" variant="solid" onClick={() => onDelete(template.id)} disabled={deleting}>
                Confirmer la suppression
              </Button>
              <Button size="1" variant="soft" color="gray" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <Button size="1" color="red" variant="soft" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={12} /> Supprimer
            </Button>
          )}
        </Flex>
      </Flex>

      <Box>
        <Text size="2" weight="bold" mb="1">Pattern de dimension</Text>
        <Card>
          <Code size="2">{template.pattern}</Code>
        </Card>
      </Box>

      <Box>
        <Text size="2" weight="bold" mb="2">Champs ({template.fields?.length ?? 0})</Text>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Cle</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Libelle</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Unite</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Requis</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Valeurs</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(template.fields || []).map((field) => (
              <Table.Row key={field.key}>
                <Table.Cell><Code size="1">{field.key}</Code></Table.Cell>
                <Table.Cell><Text size="2">{field.label}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={FIELD_TYPE_COLOR[field.field_type] || 'gray'} variant="soft" size="1">
                    {FIELD_TYPE_LABEL[field.field_type] || field.field_type}
                  </Badge>
                </Table.Cell>
                <Table.Cell><Text size="2" color="gray">{field.unit || '—'}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={field.required ? 'red' : 'gray'} variant="soft" size="1">
                    {field.required ? 'Oui' : 'Non'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="1" color="gray">
                    {field.enum_values?.map((v) => v.label).join(', ') || '—'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Flex>
  );
}

PartTemplateDetail.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    version: PropTypes.number.isRequired,
    pattern: PropTypes.string.isRequired,
    fields: PropTypes.array,
  }),
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};
