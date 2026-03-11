/**
 * @fileoverview Formulaire creation/edition (nouvelle version) d'un template de piece
 * @module components/stock/PartTemplateCreateForm
 */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, ScrollArea, Text, TextField } from '@radix-ui/themes';
import FormErrors from '@/components/shared/FormErrors';
import { Plus } from 'lucide-react';
import PartTemplateFieldRow from '@/components/stock/PartTemplateFieldRow';
import { handleAPIError } from '@/lib/api/errors';

const EMPTY_FIELD = () => ({ key: '', label: '', field_type: 'number', unit: '', required: true, _enumRaw: '' });

const parseEnumRaw = (raw) =>
  (raw || '').split('\n').map((line) => {
    const [value, ...rest] = line.split('=');
    return { value: value.trim(), label: rest.join('=').trim() };
  }).filter((v) => v.value && v.label);

const serializeFields = (fields) =>
  fields.map(({ _enumRaw, unit, ...rest }) => ({
    ...rest,
    unit: unit || undefined,
    enum_values: rest.field_type === 'enum' ? parseEnumRaw(_enumRaw) : undefined,
  }));

function fromTemplateFields(fields = []) {
  return fields.map((f) => ({
    key: f.key,
    label: f.label,
    field_type: f.field_type,
    unit: f.unit || '',
    required: f.required ?? true,
    _enumRaw: f.enum_values?.map((v) => `${v.value}=${v.label}`).join('\n') || '',
  }));
}

export default function PartTemplateCreateForm({ template, onSave, onCancel, saving }) {
  const isEdit = !!template;
  const [code, setCode] = useState(template?.code || '');
  const [label, setLabel] = useState(template?.label || '');
  const [pattern, setPattern] = useState(template?.pattern || '');
  const [fields, setFields] = useState(() => isEdit ? fromTemplateFields(template.fields) : [EMPTY_FIELD()]);
  const [errors, setErrors] = useState([]);

  const updateField = useCallback((index, updated) => {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }, []);

  const removeField = useCallback((index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addField = () => setFields((prev) => [...prev, EMPTY_FIELD()]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!code.trim() || !label.trim() || !pattern.trim() || fields.length === 0) return;
    setErrors([]);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        label: label.trim(),
        pattern: pattern.trim(),
        fields: serializeFields(fields),
      });
    } catch (err) {
      const typed = handleAPIError(err, 'PartTemplateCreateForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Text size="3" weight="bold">
            {isEdit ? 'Modifier la trame' : 'Nouvelle trame de reference'}
          </Text>
          {isEdit && (
            <Badge color="gray" variant="outline" size="1">
              v{template.version} &rarr; v{template.version + 1}
            </Badge>
          )}
        </Flex>

        <FormErrors errors={errors} />

        <Flex gap="3" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 150 }}>
            <Text size="2" as="label" weight="bold">Code *</Text>
            <TextField.Root
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VIS_STANDARD"
              disabled={isEdit}
            />
          </Box>
          <Box style={{ flex: 2, minWidth: 200 }}>
            <Text size="2" as="label" weight="bold">Libelle *</Text>
            <TextField.Root
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Vis standard"
            />
          </Box>
        </Flex>

        <Box>
          <Text size="2" as="label" weight="bold">Pattern de dimension *</Text>
          <TextField.Root
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="{DIAM}x{LONG}-{MAT}"
          />
          <Text size="1" color="gray">Utilisez {'{'}CLE{'}'} pour chaque champ</Text>
        </Box>

        <Flex justify="between" align="center">
          <Text size="2" weight="bold">Champs ({fields.length})</Text>
          <Button type="button" size="1" variant="soft" onClick={addField}>
            <Plus size={12} /> Ajouter un champ
          </Button>
        </Flex>

        <ScrollArea style={{ maxHeight: 400 }}>
          <Flex direction="column" gap="2">
            {fields.map((field, index) => (
              <PartTemplateFieldRow
                key={index}
                field={field}
                index={index}
                onChange={updateField}
                onRemove={removeField}
              />
            ))}
          </Flex>
        </ScrollArea>

        <Flex justify="end" gap="2" pt="2">
          <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" color="blue" size="2" disabled={saving}>
            {isEdit ? `Publier v${template.version + 1}` : 'Creer la trame'}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

PartTemplateCreateForm.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    version: PropTypes.number.isRequired,
    pattern: PropTypes.string,
    fields: PropTypes.array,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
