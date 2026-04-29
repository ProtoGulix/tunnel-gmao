/**
 * @fileoverview Ligne d'edition d'un champ de template
 * @module components/stock/PartTemplateFieldRow
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Checkbox, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Plus, Trash2 } from 'lucide-react';

const EMPTY_ENUM_VALUE = () => ({ value: '', label: '' });

export default function PartTemplateFieldRow({ field, index, onChange, onRemove, usedInPattern }) {
  const update = (key, value) => onChange(index, { ...field, [key]: value });
  const color = usedInPattern ? 'green' : 'gray';

  return (
    <Box style={{ borderLeft: `3px solid var(--${color}-6)`, borderRadius: 4, background: 'var(--gray-1)' }}>
      <Flex align="center" gap="2" px="2" py="1">
        <Badge
          variant="soft"
          color={color}
          style={{ width: 24, justifyContent: 'center', flexShrink: 0, fontSize: 11 }}
        >
          {index + 1}
        </Badge>

        <TextField.Root
          value={field.key}
          onChange={(e) => update('key', e.target.value.toUpperCase())}
          placeholder="CLE"
          size="1"
          style={{ width: 90, flexShrink: 0 }}
        />

        <TextField.Root
          value={field.label}
          onChange={(e) => update('label', e.target.value)}
          placeholder="Libelle"
          size="1"
          style={{ flex: 1, minWidth: 0 }}
        />

        <Select.Root value={field.field_type} onValueChange={(v) => update('field_type', v)}>
          <Select.Trigger variant="soft" size="1" style={{ width: 100, flexShrink: 0 }} />
          <Select.Content>
            <Select.Item value="number">Nombre</Select.Item>
            <Select.Item value="text">Texte</Select.Item>
            <Select.Item value="enum">Liste</Select.Item>
          </Select.Content>
        </Select.Root>

        <Box style={{ width: 70, flexShrink: 0 }}>
          {field.field_type === 'number' && (
            <TextField.Root
              value={field.unit || ''}
              onChange={(e) => update('unit', e.target.value)}
              placeholder="mm"
              size="1"
            />
          )}
        </Box>

        <Flex align="center" gap="1" style={{ width: 64, flexShrink: 0 }}>
          <Checkbox
            size="1"
            checked={field.required}
            onCheckedChange={(v) => update('required', v)}
          />
          <Text size="1" color="gray">Requis</Text>
        </Flex>

        <Button size="1" variant="ghost" color="red" style={{ flexShrink: 0 }} onClick={() => onRemove(index)}>
          <Trash2 size={12} />
        </Button>
      </Flex>

      {field.field_type === 'enum' && (
        <Box px="3" pb="2" style={{ borderTop: '1px solid var(--gray-4)' }}>
          <Flex justify="between" align="center" py="1">
            <Text size="1" color="gray">Valeurs de la liste</Text>
            <Button
              type="button"
              size="1"
              variant="ghost"
              onClick={() => update('_enumValues', [...(field._enumValues || []), EMPTY_ENUM_VALUE()])}
            >
              <Plus size={11} /> Ajouter
            </Button>
          </Flex>

          {(field._enumValues || []).length === 0 ? (
            <Text size="1" color="gray">Aucune valeur — cliquez sur Ajouter</Text>
          ) : (
            <Flex direction="column" gap="1">
              {(field._enumValues || []).map((ev, i) => (
                <Flex key={i} align="center" gap="1">
                  <TextField.Root
                    value={ev.value}
                    onChange={(e) => {
                      const next = field._enumValues.map((v, j) => j === i ? { ...v, value: e.target.value.toUpperCase() } : v);
                      update('_enumValues', next);
                    }}
                    placeholder="CLE"
                    size="1"
                    style={{ width: 90 }}
                  />
                  <Text size="1" color="gray">=</Text>
                  <TextField.Root
                    value={ev.label}
                    onChange={(e) => {
                      const next = field._enumValues.map((v, j) => j === i ? { ...v, label: e.target.value } : v);
                      update('_enumValues', next);
                    }}
                    placeholder="Libelle affiche"
                    size="1"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => update('_enumValues', field._enumValues.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={11} />
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}

PartTemplateFieldRow.propTypes = {
  field: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    field_type: PropTypes.string.isRequired,
    unit: PropTypes.string,
    required: PropTypes.bool,
    _enumValues: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  usedInPattern: PropTypes.bool,
};
