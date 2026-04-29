/**
 * @fileoverview Formulaire creation/edition (nouvelle version) d'un template de piece
 * @module components/stock/PartTemplateCreateForm
 */

import { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Callout, Flex, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { AlertTriangle, Check, Edit2, Loader2, Plus } from 'lucide-react';
import PartTemplateFieldRow from '@/components/stock/PartTemplateFieldRow';
import { handleAPIError } from '@/lib/api/errors';

const EMPTY_FIELD = () => ({ key: '', label: '', field_type: 'number', unit: '', required: true, _enumValues: [] });

const serializeFields = (fields) =>
  fields.map(({ _enumValues, unit, ...rest }) => ({
    ...rest,
    unit: unit || undefined,
    enum_values: rest.field_type === 'enum'
      ? (_enumValues || []).filter((v) => v.value.trim() && v.label.trim())
      : undefined,
  }));

function fromTemplateFields(fields = []) {
  return fields.map((f) => ({
    key: f.key,
    label: f.label,
    field_type: f.field_type,
    unit: f.unit || '',
    required: f.required ?? true,
    _enumValues: f.enum_values || [],
  }));
}

export default function PartTemplateCreateForm({ template, onSave, onCancel, saving }) {
  const isEdit = !!template;
  const [code, setCode] = useState(template?.code || '');
  const [label, setLabel] = useState(template?.label || '');
  const [pattern, setPattern] = useState(template?.pattern || '');
  const [fields, setFields] = useState(() => isEdit ? fromTemplateFields(template.fields) : [EMPTY_FIELD()]);
  const [errors, setErrors] = useState([]);
  const patternInputRef = useRef(null);

  const insertFieldKey = useCallback((key) => {
    const input = patternInputRef.current;
    const insertion = `{${key}}`;
    if (!input) {
      setPattern((prev) => prev + insertion);
      return;
    }
    const start = input.selectionStart ?? pattern.length;
    const end = input.selectionEnd ?? pattern.length;
    setPattern(pattern.slice(0, start) + insertion + pattern.slice(end));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + insertion.length, start + insertion.length);
    });
  }, [pattern]);

  const updateField = useCallback((index, updated) => {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }, []);

  const removeField = useCallback((index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addField = () => setFields((prev) => [...prev, EMPTY_FIELD()]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const definedKeys = fields.map((f) => f.key).filter(Boolean);
  const usedKeys = [...pattern.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  const unknownKeys = usedKeys.filter((k) => !definedKeys.includes(k));

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', overflow: 'visible' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isEdit ? <Edit2 size={20} color="var(--blue-9)" /> : <Plus size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold" color="blue">
            {isEdit ? 'Modifier la trame' : 'Nouvelle trame de référence'}
          </Text>
          {isEdit && (
            <Badge color="gray" variant="outline" size="1">
              v{template.version} &rarr; v{template.version + 1}
            </Badge>
          )}
        </Flex>

        {errors.length > 0 && (
          <Box
            aria-live="polite"
            style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}
          >
            {errors.map((err) => (
              <Text key={err} color="red" weight="medium" as="p">• {err}</Text>
            ))}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">

            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: 1, minWidth: 150 }}>
                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                  Code *
                </Text>
                <TextField.Root
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VIS_STANDARD"
                  disabled={isEdit}
                />
              </Box>
              <Box style={{ flex: 2, minWidth: 200 }}>
                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                  Libellé *
                </Text>
                <TextField.Root
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Vis standard"
                />
              </Box>
            </Flex>

            <Box>
              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                Pattern de dimension *
              </Text>
              <TextField.Root
                ref={patternInputRef}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="{DIAM}x{LONG}-{MAT}"
              />
              {definedKeys.length > 0 && (
                <Flex gap="1" wrap="wrap" mt="1">
                  {definedKeys.map((key) => (
                    <Badge
                      key={key}
                      color={pattern.includes(`{${key}}`) ? 'green' : 'gray'}
                      variant="soft"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => insertFieldKey(key)}
                      title={`Insérer {${key}}`}
                    >
                      {`{${key}}`}
                    </Badge>
                  ))}
                </Flex>
              )}
              {unknownKeys.length > 0 && (
                <Callout.Root color="orange" size="1" mt="1">
                  <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
                  <Callout.Text>
                    Clés inconnues dans le pattern : {unknownKeys.map((k) => `{${k}}`).join(', ')}
                  </Callout.Text>
                </Callout.Root>
              )}
              {definedKeys.length === 0 && (
                <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>
                  Ajoutez des champs pour les insérer dans le pattern
                </Text>
              )}
            </Box>

            <Box>
              <Flex justify="between" align="center" mb="2">
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
                      usedInPattern={field.key ? pattern.includes(`{${field.key}}`) : false}
                    />
                  ))}
                </Flex>
              </ScrollArea>
            </Box>

            <Flex justify="between" gap="2" wrap="wrap" mt="2">
              <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                {saving
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {isEdit ? 'Publication...' : 'Création...'}</>
                  : <><Check size={14} /> {isEdit ? `Publier v${template.version + 1}` : 'Créer la trame'}</>
                }
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
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
