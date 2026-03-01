/**
 * @fileoverview Ligne d'edition d'un champ de template
 * @module components/stock/PartTemplateFieldRow
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Checkbox, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';

export default function PartTemplateFieldRow({ field, index, onChange, onRemove }) {
  const update = (key, value) => onChange(index, { ...field, [key]: value });

  return (
    <Card style={{ border: '1px solid var(--gray-5)' }}>
      <Flex direction="column" gap="2" p="2">
        <Flex justify="between" align="center">
          <Badge variant="soft" color="gray">Champ {index + 1}</Badge>
          <Button size="1" variant="ghost" color="red" onClick={() => onRemove(index)}>
            <Trash2 size={12} />
          </Button>
        </Flex>

        <Flex gap="2" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 100 }}>
            <Text size="1" color="gray">Cle *</Text>
            <TextField.Root
              value={field.key}
              onChange={(e) => update('key', e.target.value.toUpperCase())}
              placeholder="DIAM"
            />
          </Box>
          <Box style={{ flex: 2, minWidth: 140 }}>
            <Text size="1" color="gray">Libelle *</Text>
            <TextField.Root
              value={field.label}
              onChange={(e) => update('label', e.target.value)}
              placeholder="Diametre"
            />
          </Box>
          <Box style={{ minWidth: 120 }}>
            <Text size="1" color="gray">Type *</Text>
            <Select.Root value={field.field_type} onValueChange={(v) => update('field_type', v)}>
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Item value="number">Nombre</Select.Item>
                <Select.Item value="text">Texte</Select.Item>
                <Select.Item value="enum">Liste</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          {field.field_type === 'number' && (
            <Box style={{ minWidth: 80 }}>
              <Text size="1" color="gray">Unite</Text>
              <TextField.Root
                value={field.unit || ''}
                onChange={(e) => update('unit', e.target.value)}
                placeholder="mm"
              />
            </Box>
          )}
          <Flex align="end" gap="1" pb="1">
            <Checkbox
              checked={field.required}
              onCheckedChange={(v) => update('required', v)}
            />
            <Text size="1" color="gray">Requis</Text>
          </Flex>
        </Flex>

        {field.field_type === 'enum' && (
          <Box>
            <Text size="1" color="gray">Valeurs (une par ligne : VALEUR=Libelle) *</Text>
            <TextArea
              value={field._enumRaw || ''}
              onChange={(e) => update('_enumRaw', e.target.value)}
              placeholder={'INOX=Inox A2\nACIER=Acier zingue'}
              rows={3}
            />
          </Box>
        )}
      </Flex>
    </Card>
  );
}

PartTemplateFieldRow.propTypes = {
  field: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    field_type: PropTypes.string.isRequired,
    unit: PropTypes.string,
    required: PropTypes.bool,
    _enumRaw: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
