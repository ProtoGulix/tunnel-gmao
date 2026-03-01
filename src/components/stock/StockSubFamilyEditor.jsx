/**
 * @fileoverview Formulaire edition sous-famille
 * @module components/stock/StockSubFamilyEditor
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';

export default function StockSubFamilyEditor({ subFamily, onSave, onCancel, saving }) {
  const [label, setLabel] = useState('');
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    setLabel(subFamily?.label || '');
    setTemplateId(subFamily?.template?.id || '');
  }, [subFamily]);

  if (!subFamily) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const nextTemplateId = templateId.trim() || null;

    await onSave({
      label: trimmedLabel,
      template_id: nextTemplateId,
    });
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Box p="4">
        <Text size="3" weight="bold">
          Editer la sous-famille {subFamily.family_code}/{subFamily.code}
        </Text>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="3">
            <Box>
              <Text size="2" as="label" weight="bold">
                Libelle
              </Text>
              <TextField.Root
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Ex: Roulements"
              />
            </Box>

            <Box>
              <Text size="2" as="label" weight="bold">
                Template ID (optionnel)
              </Text>
              <TextField.Root
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                placeholder="UUID du template"
              />
            </Box>

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Card>
  );
}

StockSubFamilyEditor.propTypes = {
  subFamily: PropTypes.shape({
    family_code: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    template: PropTypes.shape({
      id: PropTypes.string,
      code: PropTypes.string,
      label: PropTypes.string,
    }),
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
