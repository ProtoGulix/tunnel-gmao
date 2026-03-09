/**
 * @fileoverview Formulaire creation/edition d'une sous-famille de stock
 * @module components/stock/StockSubFamilyForm
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Layers, Save } from 'lucide-react';
import { usePartTemplates } from '@/hooks/stock/usePartTemplates';
import { handleAPIError } from '@/lib/api/errors';

export default function StockSubFamilyForm({ subFamily, onSubmit, onCancel, saving }) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [errors, setErrors] = useState([]);
  const { templates } = usePartTemplates();

  const isEdit = !!subFamily;

  useEffect(() => {
    setCode(subFamily?.code || '');
    setLabel(subFamily?.label || '');
    setTemplateId(subFamily?.template?.id || '');
    setErrors([]);
  }, [subFamily]);

  const validate = () => {
    const errs = [];
    if (!isEdit && !code.trim()) errs.push('Le code sous-famille est obligatoire.');
    if (!label.trim()) errs.push('Le libellé est obligatoire.');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    const payload = {
      label: label.trim(),
      template_id: templateId || null,
    };
    if (!isEdit) payload.code = code.trim().toUpperCase();
    try {
      await onSubmit(payload);
    } catch (err) {
      const typed = handleAPIError(err, 'StockSubFamilyForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Box p="4">
        <Flex align="center" gap="2" mb="3">
          <Layers size={20} />
          <Text size="3" weight="bold">
            {isEdit
              ? `Modifier ${subFamily.family_code}/${subFamily.code}`
              : 'Nouvelle sous-famille'}
          </Text>
        </Flex>

        {errors.length > 0 && (
          <Box
            mb="3"
            p="2"
            style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)', borderRadius: 4 }}
          >
            {errors.map((err) => (
              <Text key={err} size="2" color="red" as="p">
                • {err}
              </Text>
            ))}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {!isEdit && (
              <Box>
                <Text size="2" as="label" weight="bold">
                  Code sous-famille *
                </Text>
                <TextField.Root
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: RLT"
                />
              </Box>
            )}

            <Box>
              <Text size="2" as="label" weight="bold">
                Libellé *
              </Text>
              <TextField.Root
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Roulements"
              />
            </Box>

            <Box>
              <Text size="2" as="label" weight="bold">
                Trame de référence
              </Text>
              <Select.Root
                value={templateId || 'none'}
                onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}
              >
                <Select.Trigger variant="soft" />
                <Select.Content>
                  <Select.Item value="none">Aucune trame</Select.Item>
                  {templates.map((tpl) => (
                    <Select.Item key={tpl.id} value={tpl.id}>
                      {tpl.label} (v{tpl.version})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                <Save size={14} />
                Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Card>
  );
}

StockSubFamilyForm.propTypes = {
  subFamily: PropTypes.shape({
    family_code: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    template: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
