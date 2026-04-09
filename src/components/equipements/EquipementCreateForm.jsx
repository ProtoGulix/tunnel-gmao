/**
 * @fileoverview Formulaire inline de création d'un équipement
 * @module components/equipements/EquipementCreateForm
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, Flex, Text, Button, TextField, Select } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import { fetchEquipementClasses } from '@/api/equipementClasses';

const DEFAULT_FORM = { name: '', code: '', equipement_class_id: '' };

export default function EquipementCreateForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (classes.length > 0) return;
    fetchEquipementClasses().then(setClasses).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors(['Le nom est obligatoire.']);
      return;
    }
    try {
      setSubmitting(true);
      setErrors([]);
      const payload = { name: form.name.trim() };
      if (form.code.trim()) payload.code = form.code.trim();
      if (form.equipement_class_id) payload.equipement_class_id = form.equipement_class_id;
      await onSubmit(payload);
    } catch (err) {
      setErrors([err.response?.data?.detail ?? err.message ?? 'Erreur lors de la création.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">Nouvel équipement</Text>
        </Flex>

        {errors.length > 0 && (
          <Box
            style={{
              background: 'var(--red-3)',
              border: '1px solid var(--red-7)',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
            {errors.map((err, idx) => (
              <Text key={idx} color="red" size="1" as="div">• {err}</Text>
            ))}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '2', minWidth: '200px' }}>
                <Text size="2" weight="bold" mb="1" as="div">
                  Nom <Text as="span" color="red">*</Text>
                </Text>
                <TextField.Root
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex : Scie principale, Pont roulant A…"
                  autoFocus
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Text size="2" weight="bold" mb="1" as="div">Code</Text>
                <TextField.Root
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="Ex : SCI-01…"
                />
              </Box>
              <Box style={{ flex: '1', minWidth: '160px' }}>
                <Text size="2" weight="bold" mb="1" as="div">Classe</Text>
                <Select.Root
                  value={form.equipement_class_id || '__none__'}
                  onValueChange={(v) => setForm((f) => ({ ...f, equipement_class_id: v === '__none__' ? '' : v }))}
                >
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="__none__">Aucune classe</Select.Item>
                    {classes.map((c) => (
                      <Select.Item key={c.id} value={c.id}>
                        {c.code} — {c.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            <Flex justify="end" gap="2">
              <Button size="2" type="button" variant="soft" color="gray" onClick={onCancel} disabled={submitting}>
                Annuler
              </Button>
              <Button size="2" type="submit" color="blue" disabled={submitting}>
                <Plus size={16} />
                {submitting ? 'Création…' : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

EquipementCreateForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
