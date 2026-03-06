/**
 * @fileoverview Formulaire creation/edition d'une famille de stock
 * @module components/stock/StockFamilyForm
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { Layers, Save } from 'lucide-react';

export default function StockFamilyForm({ family, onSubmit, onCancel, saving }) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [errors, setErrors] = useState([]);

  const isEdit = !!family;

  useEffect(() => {
    setCode(family?.family_code || '');
    setLabel(family?.label || '');
    setErrors([]);
  }, [family]);

  const validate = () => {
    const errs = [];
    if (!isEdit && !code.trim()) errs.push('Le code famille est obligatoire.');
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
    await onSubmit({ code: code.trim().toUpperCase(), label: label.trim() });
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Box p="4">
        <Flex align="center" gap="2" mb="3">
          <Layers size={20} />
          <Text size="3" weight="bold">
            {isEdit ? `Modifier la famille ${family.family_code}` : 'Nouvelle famille'}
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
            <Box>
              <Text size="2" as="label" weight="bold">
                Code famille *
              </Text>
              <TextField.Root
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: ELE"
                disabled={isEdit}
              />
            </Box>

            <Box>
              <Text size="2" as="label" weight="bold">
                Libellé
              </Text>
              <TextField.Root
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Electronique"
              />
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

StockFamilyForm.propTypes = {
  family: PropTypes.shape({
    family_code: PropTypes.string,
    label: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
