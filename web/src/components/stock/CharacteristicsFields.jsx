import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Select, Text, TextField } from '@radix-ui/themes';

function TemplateFieldInput({ field, value, error, onCharChange, onNumberChange }) {
  if (field.field_type === 'enum') {
    return (
      <Select.Root value={value} onValueChange={(val) => onCharChange(field.key, val)}>
        <Select.Trigger placeholder="Choisir…" style={{ width: '100%' }} />
        <Select.Content>
          {(field.enum_values || []).map((opt) => (
            <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    );
  }
  const handleChange = (e) => field.field_type === 'number'
    ? onNumberChange(field.key, e.target.value)
    : onCharChange(field.key, e.target.value);
  return (
    <>
      <TextField.Root
        type={field.field_type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={handleChange}
        placeholder={field.unit ? `en ${field.unit}` : field.key}
        color={error ? 'red' : undefined}
      />
      {error && <Text size="1" color="red" style={{ display: 'block', marginTop: 2 }}>{error}</Text>}
    </>
  );
}

TemplateFieldInput.propTypes = {
  field: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  error: PropTypes.string,
  onCharChange: PropTypes.func.isRequired,
  onNumberChange: PropTypes.func.isRequired,
};

export default function CharacteristicsFields({ loading, template, characteristics, onCharChange, spec, dimension, onSpecChange, onDimChange, readonly }) {
  const [fieldErrors, setFieldErrors] = useState({});

  const handleNumberChange = (key, rawVal) => {
    if (rawVal !== '' && isNaN(Number(rawVal))) {
      setFieldErrors((prev) => ({ ...prev, [key]: 'Valeur numérique requise' }));
    } else {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
    onCharChange(key, rawVal);
  };

  if (loading) return <Text size="1" color="gray">Chargement du template…</Text>;
  if (template) {
    return (
      <Flex gap="3" wrap="wrap">
        {(template.fields || []).map((field) => (
          <Box key={field.key} style={{ flex: 1, minWidth: 150 }}>
            <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>
              {field.label}{!readonly && field.required && ' *'}{field.unit && ` (${field.unit})`}
            </Text>
            {readonly ? (
              <Text size="2" weight="medium">{characteristics[field.key] || '—'}</Text>
            ) : (
              <TemplateFieldInput
                field={field}
                value={characteristics[field.key] ?? ''}
                error={fieldErrors[field.key]}
                onCharChange={onCharChange}
                onNumberChange={handleNumberChange}
              />
            )}
          </Box>
        ))}
      </Flex>
    );
  }
  return (
    <Flex gap="3" wrap="wrap">
      <Box style={{ flex: 1, minWidth: 150 }}>
        <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Spécification</Text>
        <TextField.Root value={spec} onChange={onSpecChange} placeholder="SKF 6205-2RS" />
      </Box>
      <Box style={{ flex: 1, minWidth: 150 }}>
        <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Dimension</Text>
        <TextField.Root value={dimension} onChange={onDimChange} placeholder="25x52x15 mm" />
      </Box>
    </Flex>
  );
}

CharacteristicsFields.propTypes = {
  loading: PropTypes.bool,
  template: PropTypes.object,
  characteristics: PropTypes.object.isRequired,
  onCharChange: PropTypes.func.isRequired,
  spec: PropTypes.string,
  dimension: PropTypes.string,
  onSpecChange: PropTypes.func.isRequired,
  onDimChange: PropTypes.func.isRequired,
  readonly: PropTypes.bool,
};
